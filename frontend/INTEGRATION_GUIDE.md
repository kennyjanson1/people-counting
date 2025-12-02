# Integration Guide - Connecting Your YOLO Model

This guide explains how to integrate your existing YOLO detection model with the People Counting System.

## Step 1: Prepare Your YOLO Model

### Option A: Use Pre-trained Model

\`\`\`bash
cd backend
python -c "from ultralytics import YOLO; YOLO('yolov8m.pt')"
\`\`\`

### Option B: Use Custom Model

If you have a custom-trained model (like `kdandadult-model.pt`):

\`\`\`bash
# Copy your model to backend directory
cp /path/to/kdandadult-model.pt backend/

# Or store in a models directory
mkdir -p backend/models
cp /path/to/kdandadult-model.pt backend/models/
\`\`\`

## Step 2: Update Backend Configuration

Edit `backend/app_fastapi.py`:

\`\`\`python
# Change this line
model = YOLO("yolov8m.pt")  # Default model

# To your custom model
model = YOLO("kdandadult-model.pt")  # Your model
\`\`\`

### Update Class Names

If your model has different classes:

\`\`\`python
# Default (COCO dataset)
CLASS_NAMES = ["person"]

# Your custom model
CLASS_NAMES = ["Kid", "Adult"]  # Must match your model's classes
\`\`\`

## Step 3: Update Gender Detection Logic

By default, the system treats model classes as gender-neutral. Modify tracking logic:

\`\`\`python
# In process_video_file() or event_generator()

# Current: treats as male/female based on class index
def get_gender(class_index, class_name):
    if class_name == "Kid":
        return "male"
    elif class_name == "Adult":
        return "female"
    else:
        return "unknown"
\`\`\`

### Option: Add Separate Gender Classifier

For more accurate gender detection, add a secondary classifier:

\`\`\`python
from your_gender_model import GenderClassifier

gender_model = GenderClassifier("gender-model.pt")

for (x, y, w, h) in boxes:
    crop = frame[y:y+h, x:x+w]
    gender = gender_model.predict(crop)  # 'male' or 'female'
\`\`\`

## Step 4: Adjust Detection Parameters

Tune for your specific model in `app_fastapi.py`:

\`\`\`python
# YOLO detection parameters
results = model(frame, 
                conf=0.4,      # Confidence threshold (0-1)
                iou=0.5,       # IoU threshold for NMS (0-1)
                verbose=False)
\`\`\`

**Recommendations:**
- `conf=0.3` to `0.5`: Lower = more detections (may include false positives)
- `conf=0.6` to `0.9`: Higher = fewer detections (may miss people)
- `iou=0.4` to `0.6`: Adjust based on detection clustering

## Step 5: Test Integration

### Start Backend

\`\`\`bash
cd backend
source venv/bin/activate
python app_fastapi.py
\`\`\`

### Start Frontend

\`\`\`bash
npm run dev
\`\`\`

### Test with Sample Video

1. Open `http://localhost:3000`
2. Upload a test video or use webcam
3. Check detection accuracy
4. Monitor FPS in UI

## Step 6: Performance Optimization

### For Real-time Webcam

\`\`\`python
# Process every Nth frame
FRAME_SKIP = 2
frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if frame_count % FRAME_SKIP == 0:
        results = model(frame)
    frame_count += 1
\`\`\`

### For Video Processing

\`\`\`python
# Resize frames for faster processing
scale = 0.5
resized = cv2.resize(frame, (int(frame.shape[1] * scale), 
                             int(frame.shape[0] * scale)))
results = model(resized)
\`\`\`

### GPU Acceleration

Install CUDA support for significant speedup:

\`\`\`bash
pip uninstall torch -y
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
\`\`\`

Verify GPU is being used:
\`\`\`python
import torch
print(torch.cuda.is_available())  # Should print True
\`\`\`

## Step 7: Customization Examples

### Custom Line Position

Adjust reference line location in frontend:

\`\`\`tsx
const linePosition = Math.floor(dimensions.width * 0.5);  // 50% from left
// const linePosition = Math.floor(dimensions.width * 0.33);  // 33% from left
\`\`\`

### Custom Counter Logic

Modify counting logic in `backend/app_fastapi.py`:

\`\`\`python
# Current: Single line crossing
if prev_x > line_position and current_x < line_position:
    counts[f"{label}_out"] += 1

# Option: Multiple zones
if current_x > zone1_start and current_x < zone1_end:
    # Zone 1 logic
elif current_x > zone2_start and current_x < zone2_end:
    # Zone 2 logic
\`\`\`

### Custom Statistics

Add new metrics to track:

\`\`\`python
# Add to stats dictionary
stats = {
    "maleIn": ...,
    "maleOut": ...,
    "femaleIn": ...,
    "femaleOut": ...,
    "currentCount": ...,
    "averageConfidence": np.mean(confs),  # NEW
    "detectionCount": len(boxes),         # NEW
    "fps": fps
}
\`\`\`

## Step 8: Deploy to Production

### Update Environment Variables

\`\`\`bash
# For cloud deployment
PYTHON_BACKEND_URL=https://your-backend.com
NEXT_PUBLIC_API_URL=https://your-domain.com
\`\`\`

### Docker Setup

\`\`\`dockerfile
# backend/Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app_fastapi.py"]
\`\`\`

\`\`\`bash
docker build -t people-counting-backend .
docker run -p 5000:5000 people-counting-backend
\`\`\`

## Troubleshooting Integration

### Model Not Found Error
\`\`\`
FileNotFoundError: model.pt not found
\`\`\`
**Solution**: Ensure model file is in correct directory or specify full path

### GPU Out of Memory
\`\`\`
RuntimeError: CUDA out of memory
\`\`\`
**Solutions**:
- Use smaller model (yolov8n)
- Reduce input image size
- Process fewer frames per second

### Low Detection Accuracy
**Check**:
1. Is confidence threshold too high?
2. Is model trained on similar data?
3. Are lighting conditions appropriate?
4. Try different model size

### Gender Classification Incorrect
**Solutions**:
1. Verify class names match model output
2. Add dedicated gender classifier
3. Retrain model with balanced dataset

## Advanced: Training Custom Model

To train your own YOLO model:

\`\`\`python
from ultralytics import YOLO

# Load pretrained model
model = YOLO('yolov8m.yaml')

# Train on custom dataset
results = model.train(
    data='data.yaml',      # Dataset config
    epochs=100,
    imgsz=640,
    device=0               # GPU device
)

# Save model
model.save('custom-model.pt')
\`\`\`

Dataset format (COCO or Pascal VOC):
\`\`\`
dataset/
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
\`\`\`

---

For more details, see [YOLOv8 Documentation](https://docs.ultralytics.com/)
