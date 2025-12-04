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

# ========================
# Centroid Tracker
# ========================
class CentroidTracker:
    def __init__(self, max_disappeared=80):
        self.next_object_id = 0
        self.objects = OrderedDict()
        self.disappeared = OrderedDict()
        self.genders = {}  # Track gender for each object
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

# CORS middleware
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
    detection_model = YOLO("yolov8n.pt")  # Person detection
    gender_model = YOLO("gender-cls.pt")  # Gender classification
except Exception as e:
    print(f"Error loading models: {e}")
    print("Make sure gender-cls.pt is in the backend folder")

# ========================
# Global Variables
# ========================
counts = {
    "male_in": 0,
    "male_out": 0,
    "female_in": 0,
    "female_out": 0,
    "current_count": 0,
}
ct = CentroidTracker()
previous_x = {}
crossed_recently = {}
line_position = None
frame_width = None
fps_counter = 0
prev_time = time.time()

# ========================
# Helper Functions
# ========================
def detect_and_classify(frame):
    """Core detection + gender classification (shared logic)"""
    det_results = detection_model(frame, conf=0.4, classes=0, verbose=False)  # class 0 = person
    
    centroids, genders = [], []
    detections = []
    
    for result in det_results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        
        for box, conf in zip(boxes, confs):
            if conf < 0.4:
                continue
            
            x1, y1, x2, y2 = map(int, box)
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
            width = x2 - x1
            height = y2 - y1
            
            # Crop person region
            person_crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
            
            gender = 0
            if person_crop.size > 0:
                # Gender classification
                gender_results = gender_model(person_crop, verbose=False)
                if gender_results and len(gender_results) > 0:
                    boxes_gender = gender_results[0].boxes
                    if len(boxes_gender) > 0:
                        gender = int(boxes_gender[0].cls[0])
            
            centroids.append((cx, cy))
            genders.append(gender)
            
            detections.append({
                "id": len(detections),  # temporary id, will be replaced by tracker id
                "x": x1,
                "y": y1,
                "width": width,
                "height": height,
                "confidence": float(conf),
                "gender": "male" if gender == 1 else "female",
                "label": "Male" if gender == 1 else "Female"
            })
    
    return centroids, genders, detections

def update_tracking_and_counts():
    """Update tracking, counts logic, and return objects"""
    global previous_x, crossed_recently, counts
    
    objects, tracked_genders = ct.update(centroids, genders)
    
    for (object_id, centroid) in objects.items():
        current_x = centroid[0]
        gender = tracked_genders[object_id]
        
        # Count logic
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
    
    # Clean previous_x
    for oid in list(previous_x.keys()):
        if oid not in objects:
            previous_x.pop(oid, None)
            crossed_recently.pop(oid, None)
    
    # Update current count
    counts["current_count"] = len(objects)
    
    return objects, tracked_genders

def get_detections_and_stats(frame):
    """Get detections and stats for API response"""
    global line_position, frame_width, prev_time
    
    if frame_width is None:
        frame_width = frame.shape[1]
        line_position = frame_width // 2

    # Get detections
    centroids, genders, detections = detect_and_classify(frame)
    
    # Tracking
    objects, tracked_genders = ct.update(centroids, genders)
    
    # Update detections with tracked ids
    updated_detections = []
    for (object_id, centroid) in objects.items():
        gender = tracked_genders[object_id]
        # Find corresponding detection
        for det in detections:
            if (det["x"] + det["width"]/2, det["y"] + det["height"]/2) == centroid:
                det["id"] = object_id
                updated_detections.append(det)
                break
    
    # Update tracking and counts
    for (object_id, centroid) in objects.items():
        current_x = centroid[0]
        gender = tracked_genders[object_id]
        
        # Count logic
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
    
    # Clean previous_x
    for oid in list(previous_x.keys()):
        if oid not in objects:
            previous_x.pop(oid, None)
            crossed_recently.pop(oid, None)
    
    # Update current count
    counts["current_count"] = len(objects)
    
    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if prev_time else 0
    prev_time = curr_time
    
    return updated_detections, counts.copy(), fps

def process_frame(frame):
    """Process frame for video output (with visualization)"""
    global line_position, frame_width, counts, previous_x, crossed_recently, prev_time

    if frame_width is None:
        frame_width = frame.shape[1]
        line_position = frame_width // 2

    # Get detections
    centroids, genders, detections = detect_and_classify(frame)

    # Tracking
    objects, tracked_genders = ct.update(centroids, genders)
    
    # Draw detections
    for det in detections:
        x1, y1 = det["x"], det["y"]
        x2, y2 = x1 + det["width"], y1 + det["height"]
        color = (0, 0, 255) if det["gender"] == "male" else (255, 0, 0)  # Blue=Male, Red=Female
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, det["label"], (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Update tracking and counts
    for (object_id, centroid) in objects.items():
        current_x = centroid[0]
        gender = tracked_genders[object_id]
        color = (0, 0, 255) if gender == 1 else (255, 0, 0)
        
        cv2.putText(frame, f"ID {object_id}", (centroid[0] - 30, centroid[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        cv2.circle(frame, centroid, 4, color, -1)
        
        # Count logic
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
    
    # Clean previous_x
    for oid in list(previous_x.keys()):
        if oid not in objects:
            previous_x.pop(oid, None)
            crossed_recently.pop(oid, None)
    
    # Update current count
    counts["current_count"] = len(objects)
    
    # Draw line
    cv2.line(frame, (line_position, 0), (line_position, frame.shape[0]), (0, 0, 255), 2)
    
    # Draw stats
    cv2.putText(frame, f"Male In: {counts['male_in']}  Out: {counts['male_out']}",
                (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.putText(frame, f"Female In: {counts['female_in']}  Out: {counts['female_out']}",
                (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if curr_time - prev_time > 0 else 0
    prev_time = curr_time
    cv2.putText(frame, f"FPS: {fps:.2f}", (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    return frame

# ========================
# API Endpoints
# ========================

@app.post("/api/process-video")
async def process_video(file: UploadFile = File(...)):
    """Process uploaded video file"""
    global counts
    counts = {"male_in": 0, "male_out": 0, "female_in": 0, "female_out": 0, "current_count": 0}
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    
    temp_file = "temp_video.mp4"
    with open(temp_file, "wb") as f:
        f.write(contents)
    
    cap = cv2.VideoCapture(temp_file)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    out = cv2.VideoWriter("output_video.mp4", cv2.VideoWriter_fourcc(*'mp4v'), fps, (frame_width, frame_height))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = process_frame(frame)
        out.write(frame)
    
    cap.release()
    out.release()
    
    return JSONResponse({"status": "success", "counts": counts, "output_file": "output_video.mp4"})

@app.get("/api/stats")
async def get_stats():
    """Get current statistics"""
    return JSONResponse(counts)

@app.get("/api/stream")
async def stream_stats():
    """Stream statistics via Server-Sent Events"""
    async def event_generator():
        while True:
            yield f"data: {json.dumps(counts)}\n\n"
            await asyncio.sleep(0.5)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/health")
async def health():
    """Health check"""
    return JSONResponse({"status": "ok", "models_loaded": True})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data.startswith("data:image/jpeg;base64,"):
                # Decode base64 image
                image_data = base64.b64decode(data.split(",")[1])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # Process frame
                detections, stats, fps = get_detections_and_stats(frame)

                # Send back detections and stats
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
