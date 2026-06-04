from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os

from app.database import get_db, Recording, Camera
from app.routes.auth import get_current_user, require_admin

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class RecordingCreate(BaseModel):
    camera_id:  int
    file_path:  str
    file_size:  Optional[float] = None
    duration:   Optional[int]   = None
    has_alert:  bool = False
    label_tags: Optional[str]   = None
    started_at: Optional[datetime] = None

class CameraSnip(BaseModel):
    id:   int
    name: str
    zone: Optional[str]
    class Config:
        from_attributes = True

class RecordingFullOut(BaseModel):
    id:         int
    camera_id:  int
    file_path:  str
    file_size:  Optional[float]
    duration:   Optional[int]
    started_at: Optional[datetime] = None
    ended_at:   Optional[datetime]
    has_alert:  bool
    label_tags: Optional[str]
    camera:     Optional[CameraSnip]
    class Config:
        from_attributes = True


# ── Routes (ORDER MATTERS: specific before parameterized) ─────────────────────

@router.get("/", response_model=List[RecordingFullOut])
def list_recordings(
    camera_id:  Optional[int]  = Query(None),
    has_alert:  Optional[bool] = Query(None),
    limit:      int            = Query(50, le=200),
    offset:     int            = Query(0),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Recording).options(joinedload(Recording.camera))
    if camera_id is not None: q = q.filter(Recording.camera_id == camera_id)
    if has_alert is not None: q = q.filter(Recording.has_alert == has_alert)
    return q.order_by(Recording.started_at.desc()).offset(offset).limit(limit).all()


@router.get("/stats")                          # ← MUST be before /{recording_id}
def recording_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import func
    total       = db.query(Recording).count()
    with_alerts = db.query(Recording).filter(Recording.has_alert == True).count()
    total_size  = db.query(func.sum(Recording.file_size)).scalar() or 0
    total_dur   = db.query(func.sum(Recording.duration)).scalar()  or 0
    return {
        "total":            total,
        "with_alerts":      with_alerts,
        "total_size_mb":    round(total_size, 2),
        "total_duration_s": total_dur,
    }


@router.post("/", response_model=RecordingFullOut)
def create_recording(data: RecordingCreate, db: Session = Depends(get_db)):
    rec_data = data.model_dump()
    if not rec_data.get("started_at"):
        rec_data["started_at"] = datetime.utcnow()
    # Normalize Windows backslashes
    if rec_data.get("file_path"):
        rec_data["file_path"] = rec_data["file_path"].replace("\\", "/")
    rec = Recording(**rec_data)
    db.add(rec)
    try:
        db.commit()
        db.refresh(rec)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save recording: {str(e)}")
    return db.query(Recording).options(joinedload(Recording.camera)).filter(Recording.id == rec.id).first()


@router.get("/{recording_id}/download")       # ← parameterized routes last
def download_recording(recording_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")

    # Normalize path (handles Windows backslashes stored in DB)
    file_path = rec.file_path.replace("\\", "/") if rec.file_path else ""

    if file_path and os.path.isfile(file_path):
        return FileResponse(
            path=file_path,
            media_type="video/mp4",
            filename=os.path.basename(file_path),
        )

    print(f"[WARN] File not found on disk: {file_path!r} — serving fallback")
    return RedirectResponse(
        url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    )


@router.get("/{recording_id}", response_model=RecordingFullOut)
def get_recording(recording_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    rec = db.query(Recording).options(joinedload(Recording.camera)).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(404, "Recording not found")
    return rec


@router.put("/{recording_id}/end")
def end_recording(recording_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(404, "Recording not found")
    rec.ended_at = datetime.utcnow()
    db.commit()
    return {"detail": "Recording ended", "id": rec.id}


@router.delete("/{recording_id}")
def delete_recording(recording_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(404, "Recording not found")
    db.delete(rec)
    db.commit()
    return {"detail": "Recording deleted"}