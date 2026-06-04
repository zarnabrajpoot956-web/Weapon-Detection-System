from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db, Detection, Alert, Camera, Incident, Recording
from app.routes.auth import get_current_user

router = APIRouter()

class DetectionCreate(BaseModel):
    camera_id:     int
    label:         str
    confidence:    float
    bbox_x:        Optional[float] = None
    bbox_y:        Optional[float] = None
    bbox_w:        Optional[float] = None
    bbox_h:        Optional[float] = None
    snapshot_path: Optional[str]   = None
    # ── NEW: optional clip info sent by detect_realtime.py ──
    clip_path:     Optional[str]   = None   # absolute path to saved .mp4
    clip_size_mb:  Optional[float] = None
    clip_duration: Optional[int]   = None   # seconds

class DetectionOut(BaseModel):
    id:            int
    camera_id:     int
    label:         str
    confidence:    float
    snapshot_path: Optional[str]
    detected_at:   datetime
    class Config:
        from_attributes = True


@router.get("/", response_model=List[DetectionOut])
def list_detections(
    camera_id: Optional[int] = Query(None),
    label:     Optional[str] = Query(None),
    limit:     int           = Query(50, le=500),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Detection)
    if camera_id: q = q.filter(Detection.camera_id == camera_id)
    if label:     q = q.filter(Detection.label == label)
    return q.order_by(Detection.detected_at.desc()).limit(limit).all()


@router.post("/", response_model=DetectionOut)
def log_detection(
    data: DetectionCreate,
    db: Session = Depends(get_db),
):
    # Auto-create camera if it doesn't exist
    camera = db.query(Camera).filter(Camera.id == data.camera_id).first()
    if not camera:
        camera = Camera(
            id=data.camera_id,
            name=f"Camera {data.camera_id}",
            stream_url=f"camera://{data.camera_id}",
            is_active=True,
        )
        db.add(camera)
        db.flush()

    detection = Detection(**{
        k: v for k, v in data.model_dump().items()
        # strip the new clip fields — Detection model doesn't have them
        if k not in ("clip_path", "clip_size_mb", "clip_duration")
    })
    db.add(detection)
    db.flush()

    if data.confidence >= 0.50:
        severity = "critical" if data.confidence >= 0.85 else \
                   "high"     if data.confidence >= 0.70 else "medium"

        # Create alert
        alert = Alert(
            detection_id=detection.id,
            message=f"{data.label} detected with {data.confidence:.0%} confidence on camera {data.camera_id}",
            severity=severity,
        )
        db.add(alert)

        # Auto-create Incident
        existing = db.query(Incident).filter(
            Incident.detection_id == detection.id
        ).first()
        if not existing:
            incident_code = f"INC-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"
            incident = Incident(
                incident_code = incident_code,
                detection_id  = detection.id,
                camera_id     = data.camera_id,
                title         = f"{data.label} Detected on Camera {data.camera_id}",
                description   = f"{data.label} detected with {data.confidence:.0%} confidence.",
                severity      = severity,
                status        = "open",
                incident_type = "Weapon Detection",
            )
            db.add(incident)

        # ── NEW: Save a Recording row whenever an alert fires ──────────────
        # clip_path comes from detect_realtime.py if it saved a file,
        # otherwise we store a placeholder path so the row still exists
        # and the download endpoint will serve the test video fallback.
        clip_path = data.clip_path or f"/recordings/alert_{detection.id}_{data.label}.mp4"
        clip_path = clip_path.replace("\\", "/")
        recording = Recording(
            camera_id  = data.camera_id,
            file_path  = clip_path,
            file_size  = data.clip_size_mb,
            duration   = data.clip_duration,
            started_at = datetime.utcnow(),
            has_alert  = True,
            label_tags = data.label,
        )
        db.add(recording)

    db.commit()
    db.refresh(detection)
    return detection


@router.get("/stats")
def detection_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import func
    total    = db.query(Detection).count()
    by_label = db.query(Detection.label, func.count(Detection.id)).group_by(Detection.label).all()
    return {"total": total, "by_label": [{"label": l, "count": c} for l, c in by_label]}