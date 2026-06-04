from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from app.database import get_db, Camera
from app.routes.auth import get_current_user, require_admin

router = APIRouter()

# ── In-Memory Store for Live Camera Frames ──────────────────────────────
# Keys are camera IDs (int), values are raw JPEG bytes
live_frames = {}

@router.post("/{camera_id}/live-frame")
async def upload_live_frame(camera_id: int, request: Request, _=Depends(get_current_user)):
    """
    Receives raw JPEG frames from the detection script.
    """
    # Read raw body bytes
    frame_bytes = await request.body()
    if not frame_bytes:
        raise HTTPException(status_code=400, detail="Empty frame")
    
    live_frames[camera_id] = frame_bytes
    return {"status": "success"}


@router.get("/{camera_id}/stream")
async def stream_camera(camera_id: int, db: Session = Depends(get_db)):
    """
    Streams the latest frame from memory to the frontend using MJPEG.
    """
    # Verify the camera exists
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")

    async def frame_generator():
        while True:
            frame = live_frames.get(camera_id)
            if frame:
                # Format bytes for standard MJPEG stream
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n'
                )
            # Control frame rate limit to reduce CPU usage (~25 FPS)
            await asyncio.sleep(0.04)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# ── Rest of your existing Camera endpoints (list_cameras, add_camera, etc.) ──
class CameraCreate(BaseModel):
    name: str
    location: Optional[str] = None
    stream_url: str

class CameraOut(BaseModel):
    id: int
    name: str
    location: Optional[str]
    stream_url: str
    is_active: bool
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CameraOut])
def list_cameras(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Camera).all()

@router.post("/", response_model=CameraOut)
def add_camera(data: CameraCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    cam = Camera(**data.model_dump())
    db.add(cam); db.commit(); db.refresh(cam)
    return cam

@router.put("/{camera_id}/toggle")
def toggle_camera(camera_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam.is_active = not cam.is_active
    db.commit()
    return {"id": cam.id, "is_active": cam.is_active}

@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(cam); db.commit()
    return {"detail": "Camera deleted"}