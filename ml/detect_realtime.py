import argparse, cv2, os, time, requests, queue, threading
from pathlib import Path
from ultralytics import YOLO
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
BACKEND_URL          = os.getenv("BACKEND_URL",       "http://localhost:8000")
BACKEND_USERNAME     = os.getenv("BACKEND_USERNAME", "admin1")
BACKEND_PASSWORD     = os.getenv("BACKEND_PASSWORD", "secret")
WEIGHTS_PATH         = Path(__file__).parent / "weights" / "best.pt"
SNAPSHOT_DIR         = Path(__file__).parent / "detections" / "snapshots"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
CONFIDENCE_THRESHOLD = 0.50
POST_COOLDOWN_SEC    = 2.0

# ── NEW: Recording config ─────────────────────────────────────────────────────
RECORDINGS_DIR       = Path(__file__).parent / "detections" / "recordings"
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
CLIP_PRE_SECONDS     = 3    # seconds of footage BEFORE the detection
CLIP_POST_SECONDS    = 5    # seconds of footage AFTER the detection
FPS_ESTIMATE         = 20   # approximate camera FPS for buffer sizing

# Queue for offloading frame transmission away from the main OpenCV/YOLO loop
frame_queue = queue.Queue(maxsize=1)


# ── Auth ──────────────────────────────────────────────────────────────────────
def get_token() -> str | None:
    try:
        r = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            data={"username": BACKEND_USERNAME, "password": BACKEND_PASSWORD},
            timeout=5,
        )
        if r.status_code == 200:
            token = r.json().get("access_token")
            print(f"[AUTH] Logged in as '{BACKEND_USERNAME}' ✓")
            return token
        else:
            print(f"[AUTH] Login failed ({r.status_code}): {r.text}")
            return None
    except Exception as e:
        print(f"[AUTH] Cannot reach backend: {e}")
        return None


def post_detection(payload: dict, token: str, session: requests.Session) -> dict | None:
    try:
        r = session.post(
            f"{BACKEND_URL}/api/detections/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,  # slightly longer timeout since we now send more data
        )
        if r.status_code == 401:
            print("[AUTH] Token expired — will re-login next detection")
            return None
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[ERROR] POST detection failed: {e}")
        return None


# ── NEW: Save clip from frame buffer ─────────────────────────────────────────
def save_clip(frames: list, frame_size: tuple, fps: float, label: str, camera_id: int) -> tuple[str | None, float | None, int | None]:
    """
    Writes buffered frames to an mp4 file.
    Returns (clip_path, size_mb, duration_seconds) or (None, None, None) on failure.
    """
    if not frames:
        return None, None, None

    try:
        ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"alert_cam{camera_id}_{label}_{ts}.mp4"
        clip_path = str(RECORDINGS_DIR / filename)

        w, h   = frame_size
        writer = cv2.VideoWriter(
            clip_path,
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (w, h),
        )
        for f in frames:
            writer.write(f)
        writer.release()

        size_mb  = round(os.path.getsize(clip_path) / 1_000_000, 2)
        duration = round(len(frames) / fps)
        print(f"[REC] Clip saved → {filename} ({size_mb} MB, {duration}s)")
        return clip_path, size_mb, duration

    except Exception as e:
        print(f"[REC] Failed to save clip: {e}")
        return None, None, None


# ── Threaded Frame Sender ─────────────────────────────────────────────────────
def frame_sender_worker(camera_id: int, token: str):
    session = requests.Session()
    print("[STREAM] Live video background worker started.")
    while True:
        try:
            frame_bytes = frame_queue.get()
            if frame_bytes is None:
                break
            session.post(
                f"{BACKEND_URL}/api/cameras/{camera_id}/live-frame",
                data=frame_bytes,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/octet-stream"
                },
                timeout=1
            )
            frame_queue.task_done()
        except Exception:
            time.sleep(0.05)


# ── NEW: Threaded post-detection clip recorder ────────────────────────────────
def record_post_clip_and_post(
    pre_frames:  list,
    cap:         cv2.VideoCapture,
    frame_size:  tuple,
    fps:         float,
    label:       str,
    camera_id:   int,
    base_payload: dict,
    token:       str,
    session:     requests.Session,
):
    """
    Runs in a background thread.
    1. Captures CLIP_POST_SECONDS more frames from the camera.
    2. Combines pre + post frames into one clip.
    3. Saves the clip and POSTs the detection with clip metadata.
    """
    post_frame_count = int(fps * CLIP_POST_SECONDS)
    post_frames = []

    for _ in range(post_frame_count):
        ret, frame = cap.read()
        if ret:
            post_frames.append(frame)
        time.sleep(1.0 / fps)

    all_frames = pre_frames + post_frames
    clip_path, size_mb, duration = save_clip(all_frames, frame_size, fps, label, camera_id)

    payload = {
        **base_payload,
        "clip_path":     clip_path,
        "clip_size_mb":  size_mb,
        "clip_duration": duration,
    }

    result = post_detection(payload, token, session)
    if result:
        print(f"[DETECT] {label} → backend saved (id={result.get('id')}, clip={clip_path})")
    else:
        print(f"[DETECT] {label} → detection POST failed after clip save")


# ── Main loop ─────────────────────────────────────────────────────────────────
def run(stream_source, camera_id: int = 1):
    token = get_token()
    if not token:
        print("[WARN] Running without backend — detections/live feeds will not be saved")

    if token:
        sender_thread = threading.Thread(
            target=frame_sender_worker,
            args=(camera_id, token),
            daemon=True
        )
        sender_thread.start()

    model = YOLO(str(WEIGHTS_PATH))
    cap   = cv2.VideoCapture(
        int(stream_source) if str(stream_source).isdigit() else stream_source
    )
    if not cap.isOpened():
        print(f"[ERROR] Cannot open stream: {stream_source}")
        return

    # ── Get real FPS from camera, fallback to estimate ────────────────────
    cam_fps    = cap.get(cv2.CAP_PROP_FPS) or FPS_ESTIMATE
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Cannot read first frame")
        return
    h, w       = frame.shape[:2]
    frame_size = (w, h)

    # ── Circular pre-detection frame buffer ───────────────────────────────
    # Keeps last N frames so we capture footage BEFORE the alert triggers
    pre_buffer_size = int(cam_fps * CLIP_PRE_SECONDS)
    from collections import deque
    pre_buffer = deque(maxlen=pre_buffer_size)

    session     = requests.Session()
    last_posted = {}

    print(f"[INFO] Detection started (conf≥{CONFIDENCE_THRESHOLD}, FPS≈{cam_fps:.1f}) — press Q to quit")
    print(f"[INFO] Clips will be {CLIP_PRE_SECONDS}s pre + {CLIP_POST_SECONDS}s post = ~{CLIP_PRE_SECONDS + CLIP_POST_SECONDS}s per alert")

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)
            continue

        # Always buffer raw frames for pre-detection clip
        pre_buffer.append(frame.copy())

        results   = model(frame, verbose=False)[0]
        annotated = results.plot()

        # Enqueue annotated frame for live streaming
        if token:
            _, img_encoded = cv2.imencode('.jpg', annotated)
            try:
                frame_queue.put_nowait(img_encoded.tobytes())
            except queue.Full:
                pass

        for box in results.boxes:
            conf  = float(box.conf[0])
            label = model.names[int(box.cls[0])]

            if conf < CONFIDENCE_THRESHOLD:
                continue

            now = time.time()
            if now - last_posted.get(label, 0) < POST_COOLDOWN_SEC:
                continue

            # Save snapshot
            ts            = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            snapshot_name = f"{label}_{ts}.jpg"
            snapshot_path = str(SNAPSHOT_DIR / snapshot_name)
            cv2.imwrite(snapshot_path, frame)

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            base_payload = {
                "camera_id":     camera_id,
                "label":         label,
                "confidence":    round(conf, 4),
                "bbox_x":        round(x1, 1),
                "bbox_y":        round(y1, 1),
                "bbox_w":        round(x2 - x1, 1),
                "bbox_h":        round(y2 - y1, 1),
                "snapshot_path": snapshot_path,
                # clip fields will be added by the recording thread
            }

            last_posted[label] = now

            if token:
                # Snapshot the pre-buffer NOW before it keeps rolling
                pre_frames = list(pre_buffer)

                # ── Spawn background thread: capture post-frames, save clip, POST ──
                rec_thread = threading.Thread(
                    target=record_post_clip_and_post,
                    args=(
                        pre_frames, cap, frame_size, cam_fps,
                        label, camera_id, base_payload, token, session,
                    ),
                    daemon=True,
                )
                rec_thread.start()
                print(f"[REC] Alert! Recording clip for {label} ({conf:.0%}) in background...")
            else:
                print(f"[DETECT] {label} {conf:.0%} → snapshot saved (no backend)")

        cv2.putText(
            annotated,
            f"Threshold: {CONFIDENCE_THRESHOLD:.0%}",
            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2
        )
        cv2.imshow("Weapon Detection — Q to quit", annotated)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    # Signal stream sender to stop
    frame_queue.put(None)
    print("[INFO] Detection stopped")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--camera",    default="0",
                   help="Camera index (0,1..) or RTSP URL")
    p.add_argument("--camera-id", type=int, default=1,
                   help="Camera ID in the database")
    p.add_argument("--conf",      type=float, default=None,
                   help="Override confidence threshold (0.0–1.0)")
    args = p.parse_args()

    if args.conf is not None:
        CONFIDENCE_THRESHOLD = args.conf

    run(args.camera, args.camera_id)