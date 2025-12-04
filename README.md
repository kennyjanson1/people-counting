# People Counting System

A real-time people counting and analytics system using computer vision, capable of detecting people, classifying gender, and tracking movement across a virtual line. Supports both live webcam input and video file uploads with comprehensive statistics.

## 🚀 Features

- **Real-time Person Detection**: Uses YOLOv8 for accurate person detection
- **Gender Classification**: Distinguishes between male and female individuals
- **Object Tracking**: Centroid-based tracking for consistent identification
- **Directional Counting**: Tracks entry/exit movements across a configurable line
- **Live Analytics Dashboard**: Real-time statistics with gender breakdown
- **Dual Input Support**: Webcam streaming via WebSocket and video file uploads
- **Modern Web Interface**: Built with Next.js and Tailwind CSS
- **RESTful API**: FastAPI backend with comprehensive endpoints

## 🏗️ Project Structure

```
people-counting/
├── backend/                          # FastAPI Backend
│   ├── app.py                       # Main FastAPI application
│   ├── requirements.txt             # Python dependencies
│   ├── gender-cls.pt               # Gender classification model
│   ├── yolov8n.pt                  # YOLOv8 person detection model
│   └── train.py                    # Model training script
├── frontend/                        # Next.js Frontend
│   ├── app/                        # Next.js 13+ app directory
│   │   ├── api/                    # API routes
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home page
│   ├── components/                 # React components
│   │   ├── ui/                     # Reusable UI components
│   │   ├── live-analytics.tsx      # Main analytics component
│   │   ├── stats-dashboard.tsx     # Statistics display
│   │   ├── video-renderer.tsx      # Video display with overlays
│   │   └── video-input-selector.tsx # Input method selector
│   ├── lib/                        # Utility libraries
│   │   ├── detection-client.ts     # Backend communication client
│   │   ├── centroid-tracker.ts     # Client-side tracking
│   │   └── yolo-processor.ts       # YOLO processing utilities
│   └── public/                     # Static assets
├── human-walking-ground-truth-main/ # Sample videos for testing
└── README.md                       # This file
```

## 🛠️ Technologies Used

### Backend
- **FastAPI**: High-performance async web framework
- **OpenCV**: Computer vision library
- **Ultralytics YOLO**: State-of-the-art object detection
- **NumPy**: Numerical computing
- **WebSocket**: Real-time bidirectional communication

### Frontend
- **Next.js 14**: React framework with app directory
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **WebRTC**: Browser media capture

## 📋 Prerequisites

- **Python 3.8+**: For backend processing
- **Node.js 18+**: For frontend development
- **Webcam**: For real-time video input (optional for file uploads)
- **Git**: For cloning the repository

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd people-counting
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
# or if using pnpm
pnpm install
```

## ▶️ Running the Application

### Start Backend Server

```bash
cd backend
python app.py
```

The backend will start on `http://localhost:5000`

### Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📖 Usage

1. **Open the Application**: Navigate to `http://localhost:3000` in your browser

2. **Choose Input Method**:
   - **Webcam**: Click "Webcam" for real-time processing
   - **Upload**: Click "Upload" to select a video file

3. **View Analytics**: Watch live detections and statistics update in real-time

4. **Monitor Statistics**:
   - Current people count
   - Gender breakdown (male/female)
   - Entry/exit counts by gender

## 🔌 API Reference

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/process-video` | Process uploaded video file |
| `GET` | `/api/stats` | Get current statistics |
| `GET` | `/api/stream` | Server-sent events for stats (legacy) |
| `GET` | `/api/health` | Health check endpoint |
| `WS` | `/ws` | WebSocket for real-time frame processing |

### Frontend API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Backend health check proxy |
| `POST` | `/api/process-video` | Video processing proxy |
| `GET` | `/api/stats` | Statistics proxy |
| `GET` | `/api/stream` | Stream proxy |
| `GET` | `/api/ws` | WebSocket proxy (placeholder) |

## 🎯 How It Works

### Detection Pipeline
1. **Input Capture**: Webcam frames or video file frames
2. **Person Detection**: YOLOv8 identifies people in the frame
3. **Gender Classification**: Custom model classifies gender for each detection
4. **Object Tracking**: Centroid tracker maintains identity across frames
5. **Counting Logic**: Tracks movement across a virtual line
6. **Statistics Update**: Real-time metrics calculation

### Real-time Processing
- **Webcam**: Frames captured via `getUserMedia`, sent to backend via WebSocket
- **Video Files**: Processed frame-by-frame on upload
- **Tracking**: Maintains object identity using centroid distances
- **Counting**: Direction-based counting with cooldown to prevent double-counting

## 🧪 Testing

Sample videos are included in `human-walking-ground-truth-main/` for testing:

```bash
# Use any of the walk*.MP4 files for testing
```

## 🔧 Configuration

### Backend Configuration
- **Detection Confidence**: Configurable in `app.py` (default: 0.4)
- **Tracking Parameters**: Max disappearance frames in `CentroidTracker`
- **Line Position**: Automatically set to frame center

### Frontend Configuration
- **Video Resolution**: Ideal 1280x720 for webcam
- **Frame Rate**: Browser-dependent, typically 30 FPS
- **WebSocket URL**: Configurable in `detection-client.ts`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


**Note**: This system requires significant computational resources for real-time processing. Performance may vary based on hardware capabilities.
