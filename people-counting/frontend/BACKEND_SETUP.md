# People Counting System - Backend Setup Guide

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- GPU (recommended for faster processing, but not required)

## Installation Steps

### 1. Navigate to Backend Directory
\`\`\`bash
cd backend
\`\`\`

### 2. Run Setup Script
\`\`\`bash
bash run.sh
\`\`\`

The script will:
- Create a Python virtual environment
- Install all required dependencies
- Download YOLO models
- Start the FastAPI server

### 3. Manual Setup (Alternative)

If the script doesn't work, follow these steps:

\`\`\`bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python3 app.py
\`\`\`

## Add Gender Classification Model

The system expects a trained YOLO gender classification model named `gender-cls.pt` in the backend folder.

### Option 1: Use Pre-trained Model
If you have a pre-trained `gender-cls.pt`:
\`\`\`bash
# Copy your model to the backend folder
cp /path/to/gender-cls.pt backend/gender-cls.pt
\`\`\`

### Option 2: Train Your Own Model
Use the training script from the Colab notebook to train a custom gender classification model:
1. Upload your dataset to Roboflow
2. Run the training notebook from: `training/yologender.py`
3. Save the trained model as `backend/gender-cls.pt`

## Environment Variables

Create a `.env` file in the root directory:
\`\`\`
BACKEND_URL=http://localhost:5000
\`\`\`

## Running the Backend

Once setup is complete, start the backend:

\`\`\`bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python3 app.py
\`\`\`

The API will be available at: `http://localhost:5000`

## API Endpoints

- `POST /api/process-video` - Process video file
- `GET /api/stats` - Get current statistics
- `GET /api/stream` - Server-Sent Events stream for real-time updates
- `GET /api/health` - Health check

## Troubleshooting

### Models Not Downloading
\`\`\`bash
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
\`\`\`

### GPU Not Detected
Ensure you have CUDA installed:
\`\`\`bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
\`\`\`

### Permission Denied (on macOS/Linux)
\`\`\`bash
chmod +x backend/run.sh
\`\`\`

## Performance Tips

- Use a GPU for faster processing
- Resize videos to 720p or lower for better performance
- Adjust confidence threshold in `app.py` if detection is too sensitive
