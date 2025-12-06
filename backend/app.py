import cv2
import numpy as np
from collections import OrderedDict
from ultralytics import YOLO
import time
from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import base64
import os

# ========================
# Centroid Tracker
# ========================
class CentroidTracker:
    def __init__(self, max_disappeared=80):
        self.next_object_id = 0
        self.objects = OrderedDict()
        self.disappeared = OrderedDict()
        self.genders = {}
        self.max_disappeared = max_disappeared

    def register(self, centroid, gender):
        self.objects[self.next_object_id] = centroid
        self.disappeared[self.next_object_id] = 0
        self.genders[self.next_object_id] = gender
        self.next_object_id += 1

    def deregister(self, object_id):
        del self.objects[object_id]
        del self.disappeared[object_id]
        del self.genders[object_id]

    def update(self, input_centroids, input_genders):
        if len(input_centroids) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return self.objects, self.genders

        if len(self.objects) == 0:
            for centroid, gender in zip(input_centroids, input_genders):
                self.register(centroid, gender)
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())
            D = np.linalg.norm(np.array(object_centroids)[:, np.newaxis] - input_centroids, axis=2)
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]
            used_rows, used_cols = set(), set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue
                object_id = object_ids[row]
                self.objects[object_id] = input_centroids[col]
                self.genders[object_id] = input_genders[col]
                self.disappeared[object_id] = 0
                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(D.shape[0])) - used_rows
            unused_cols = set(range(D.shape[1])) - used_cols

            for row in unused_rows:
                object_id = object_ids[row]
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)

            for col in unused_cols:
                self.register(input_centroids[col], input_genders[col])

        return self.objects, self.genders

# ========================
# FastAPI Setup
# ========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# Load YOLO Models
# ========================
try:
    # Model untuk Live Analytics (realtime tracking) - LANGSUNG DETEKSI + KLASIFIKASI
    gender_model = YOLO("gender-cls.pt")
    print("✓ Model gender-cls.pt loaded successfully (for Live Analytics)")
except Exception as e:
    print(f"⚠ Error loading gender-cls.pt: {e}")
    gender_model = None

try:
    # Model untuk Image Upload (face detection only)
    face_model = YOLO("face-model.pt")
    print("✓ Model face-model.pt loaded successfully (for Image Upload)")
except Exception as e:
    print(f"⚠ Error loading face-model.pt: {e}")
    face_model = None

# ========================
# Global Variables (for Live Analytics)
# ========================
counts = {
    "male_in": 0,
    "male_out": 0,
    "female_in": 0,
    "female_out": 0,
    "current_count": 0,
    "current_male": 0,
    "current_female": 0,
}
ct = CentroidTracker()
previous_x = {}
crossed_recently = {}
line_position = None
frame_width = None
prev_time = time.time()

# ========================
# Helper Functions for Live Analytics (PAKAI GENDER-CLS.PT SAJA)
# ========================
def detect_and_classify_live(frame):
    """Detect and classify gender for live analytics using gender-cls.pt only"""
    if gender_model is None:
        return [], [], []
    
    # Langsung pakai gender-cls.pt (deteksi + klasifikasi sekaligus)
    results = gender_model(frame, conf=0.35, verbose=False, imgsz=640)
    
    centroids, genders = [], []
    detections = []
    
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()
        
        for box, conf, cls in zip(boxes, confs, classes):
            if conf < 0.3:
                continue
            
            x1, y1, x2, y2 = map(int, box)
            
            # Expand bounding box 20%
            width = x2 - x1
            height = y2 - y1
            expand_w = int(width * 0.2)
            expand_h = int(height * 0.2)
            
            x1 = max(0, x1 - expand_w)
            y1 = max(0, y1 - expand_h)
            x2 = min(frame.shape[1], x2 + expand_w)
            y2 = min(frame.shape[0], y2 + expand_h)
            
            gender = int(cls)  # 0=female, 1=male
            
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            centroids.append((cx, cy))
            genders.append(gender)

            width = x2 - x1
            height = y2 - y1
            
            detections.append({
                "id": len(detections),
                "x": x1,
                "y": y1,
                "width": width,
                "height": height,
                "confidence": float(conf),
                "gender": "male" if gender == 1 else "female",
                "label": "Male" if gender == 1 else "Female"
            })
    
    return centroids, genders, detections

def get_detections_and_stats(frame):
    """Get detections and stats for live analytics"""
    global line_position, frame_width, prev_time
    
    if frame_width is None:
        frame_width = frame.shape[1]
        line_position = frame_width // 2

    centroids, genders, detections = detect_and_classify_live(frame)
    objects, tracked_genders = ct.update(centroids, genders)
    
    updated_detections = []
    for (object_id, centroid) in objects.items():
        gender = tracked_genders[object_id]
        for det in detections:
            det_cx = det["x"] + det["width"]/2
            det_cy = det["y"] + det["height"]/2
            if abs(det_cx - centroid[0]) < 50 and abs(det_cy - centroid[1]) < 50:
                det["id"] = object_id
                updated_detections.append(det)
                break
    
    for (object_id, centroid) in objects.items():
        current_x = centroid[0]
        gender = tracked_genders[object_id]
        
        if object_id in previous_x:
            prev_x = previous_x[object_id]
            now = time.time()
            if now - crossed_recently.get(object_id, 0) > 1.5:
                gender_label = "male" if gender == 1 else "female"
                
                if prev_x > line_position and current_x < line_position:
                    counts[f"{gender_label}_out"] += 1
                    crossed_recently[object_id] = now
                elif prev_x < line_position and current_x > line_position:
                    counts[f"{gender_label}_in"] += 1
                    crossed_recently[object_id] = now
        
        previous_x[object_id] = current_x
    
    for oid in list(previous_x.keys()):
        if oid not in objects:
            previous_x.pop(oid, None)
            crossed_recently.pop(oid, None)
    
    counts["current_count"] = len(objects)
    male_count = sum(1 for g in tracked_genders.values() if g == 1)
    female_count = sum(1 for g in tracked_genders.values() if g == 0)
    counts["current_male"] = male_count
    counts["current_female"] = female_count
    
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if prev_time else 0
    prev_time = curr_time
    
    return updated_detections, counts.copy(), fps

# ========================
# Helper Functions for Image Upload (2-STEP: FACE DETECTION + GENDER CLASSIFICATION)
# ========================
def analyze_image(frame):
    """Analyze uploaded image using 2-step: face-model.pt + gender-cls.pt"""
    if face_model is None or gender_model is None:
        return {
            "status": "error",
            "message": "Models not loaded",
            "total_people": 0,
            "male_count": 0,
            "female_count": 0,
            "detections": []
        }
    
    h, w = frame.shape[:2]
    
    # Step 1: Detect faces using face-model.pt
    face_results = face_model(frame, conf=0.3, verbose=False, imgsz=640)
    
    male_count = 0
    female_count = 0
    detections = []
    
    for result in face_results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        
        for box, conf in zip(boxes, confs):
            if conf < 0.25:
                continue
            
            x1, y1, x2, y2 = map(int, box)
            
            # Step 2: Crop face with padding
            pad = 20
            x1p = max(0, x1 - pad)
            y1p = max(0, y1 - pad)
            x2p = min(w, x2 + pad)
            y2p = min(h, y2 + pad)
            
            face_crop = frame[y1p:y2p, x1p:x2p]
            
            if face_crop.size == 0:
                continue
            
            # Step 3: Resize and classify gender using gender-cls.pt
            face_crop_resized = cv2.resize(face_crop, (416, 416))
            gender_results = gender_model(face_crop_resized, verbose=False)
            
            # Extract gender prediction
            if len(gender_results[0].boxes) == 0:
                gender_label = "Unknown"
                gender_conf = 0.0
            else:
                cls = int(gender_results[0].boxes.cls[0])
                gender_conf = float(gender_results[0].boxes.conf[0])
                gender_label = "Male" if cls == 1 else "Female"
            
            # Count by gender
            if gender_label == "Male":
                male_count += 1
            elif gender_label == "Female":
                female_count += 1
            
            detections.append({
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1,
                "confidence": float(conf),
                "gender": gender_label.lower(),
                "label": f"{gender_label} ({gender_conf:.2f})"
            })
    
    total_people = male_count + female_count
    
    return {
        "status": "success",
        "total_people": total_people,
        "male_count": male_count,
        "female_count": female_count,
        "detections": detections
    }

# ========================
# API Endpoints
# ========================

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload and analyze image using 2-step detection (face-model.pt + gender-cls.pt)"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return JSONResponse({
                "status": "error",
                "message": "Failed to decode image"
            }, status_code=400)
        
        # Analyze image with 2-step process
        result = analyze_image(frame)
        
        return JSONResponse(result)
    
    except Exception as e:
        return JSONResponse({
            "status": "error",
            "message": str(e)
        }, status_code=500)

@app.get("/api/stats")
async def get_stats():
    """Get current statistics for live analytics"""
    return JSONResponse(counts)

@app.post("/api/reset-counts")
async def reset_counts():
    """Reset all counts for live analytics"""
    global counts, ct, previous_x, crossed_recently
    counts = {
        "male_in": 0,
        "male_out": 0,
        "female_in": 0,
        "female_out": 0,
        "current_count": 0,
        "current_male": 0,
        "current_female": 0,
    }
    ct = CentroidTracker()
    previous_x = {}
    crossed_recently = {}
    return JSONResponse({"status": "success", "message": "Counts reset"})

@app.get("/api/health")
async def health():
    """Health check"""
    return JSONResponse({
        "status": "ok",
        "models": {
            "gender_model": gender_model is not None,
            "face_model": face_model is not None
        }
    })

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for live analytics (using gender-cls.pt only for speed)"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data.startswith("data:image/jpeg;base64,"):
                image_data = base64.b64decode(data.split(",")[1])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is not None:
                    detections, stats, fps = get_detections_and_stats(frame)

                    await websocket.send_json({
                        "detections": detections,
                        "stats": stats,
                        "fps": fps
                    })
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)