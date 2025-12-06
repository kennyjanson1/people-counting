# People Counting System

A real-time people counting and analytics system using computer vision, capable of detecting people and classifying gender in a single frame. Supports live webcam input and photo uploads with comprehensive statistics.

## 🌐 Live Deployments

- **Frontend**: [Deployed on Vercel](https://people-counting-fl7t.vercel.app/)
- **Backend API**: [Deployed on Hugging Face Spaces](https://huggingface.co/spaces/Knnyjnson/People-Counting)

## 🚀 Features

- **Real-time Person Detection**: Uses YOLOv8 for accurate person detection
- **Gender Classification**: Distinguishes between male and female individuals
- **Live Analytics Dashboard**: Real-time statistics with gender breakdown
- **Photo Upload Analysis**: Process single images for instant people counting

## 🏗️ Project Structure

```
people-counting/
├── backend/                          # FastAPI Backend
│   ├── app_deployment.py            # Production deployment version
│   ├── app_local.py                # Local development version
│   ├── requirements.txt             # Python dependencies
│   ├── gender-cls.pt               # Gender classification model
│   ├── face-model.pt               # Face detection model
│   ├── train-1.py                  # Model training scripts
│   └── train-2.py
├── frontend/                        # Next.js Frontend
│   ├── app/                        # Next.js 16+ app directory
│   │   ├── api/                    # API routes (proxy to backend)
│   │   │   ├── health/             # Health check
│   │   │   ├── process-video/      # Video processing
│   │   │   ├── stats/              # Statistics
│   │   │   ├── stream/             # Stream endpoint
│   │   │   └── video/process/      # Video processing
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home page
│   ├── components/                 # React components
│   │   ├── ui/                     # Reusable UI components
│   │   ├── live-analytics.tsx      # Real-time analytics
│   │   ├── stats-dashboard.tsx     # Statistics display
│   │   ├── video-renderer.tsx      # Video display with overlays
│   │   ├── video-input-selector.tsx # Input method selector
│   │   ├── image-upload.tsx        # Photo upload component
│   │   ├── theme-provider.tsx      # Theme provider
│   │   └── theme-toggle.tsx        # Dark/light mode toggle
│   ├── lib/                        # Utility libraries
│   │   ├── detection-client.ts     # Backend communication client
│   │   ├── types.ts                # TypeScript type definitions
│   │   ├── utils.ts                # Utility functions
│   │   └── yolo-processor.ts       # YOLO processing utilities
│   ├── public/                     # Static assets
│   ├── styles/                     # Additional styles
│   ├── package.json                # Node.js dependencies
│   └── tsconfig.json               # TypeScript configuration
├── People-Counting/                # Alternative backend implementation
│   ├── app.py                      # Streamlit/Gradio app
│   ├── requirements.txt            # Dependencies
│   └── Dockerfile                  # Docker configuration
└── README.md                       # This file
```

## 🛠️ Technologies Used

### Backend
- **FastAPI**: High-performance async web framework
- **OpenCV**: Computer vision library
- **Ultralytics YOLO**: State-of-the-art object detection
- **WebSocket**: Real-time bidirectional communication
- **Uvicorn**: ASGI server for deployment

### Frontend
- **Next.js 16**: React framework with app directory
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

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

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download models (if not included)
# gender-cls.pt and face-model.pt should be in the backend directory
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

### Local Development

#### Start Backend Server

```bash
cd backend
python app_local.py
```

The backend will start on `http://localhost:7860` (simple counting logic)

Or for full deployment version:

```bash
python app_deployment.py
```

The backend will start on `http://localhost:5000`

#### Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Production Deployment

#### Backend (Hugging Face Spaces)
1. Create a new Hugging Face Space
2. Upload the backend files
3. Set the startup command to `python app_deployment.py`
4. The app will be available at `https://your-space.hf.space`

#### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Deploy the frontend directory
3. Update the backend API URLs in the environment variables
4. The app will be available at `https://your-project.vercel.app`

## 📖 Usage

1. **Open the Application**: Navigate to the deployed frontend URL or `http://localhost:3000` for local development

2. **Choose Input Method**:
   - **Webcam**: Click "Webcam" for real-time processing
   - **Upload Photo**: Click "Upload Photo" for instant image analysis

3. **View Analytics**: Watch live detections and statistics update in real-time

4. **Monitor Statistics**:
   - Current people count
   - Gender breakdown (male/female)

## 🎯 How It Works

### Detection Pipeline
1. **Input Capture**: Webcam frames or single images
2. **Face/Person Detection**: YOLO models identify all persons present in the frame
3. **Gender Classification**: Custom CNN model classifies gender of each detected person
4. **Counting Logic**: Counts the total number of people detected per frame (no tracking or movement analysis)
5. **Statistics Update**: Displays real-time count and gender distribution

### Real-time Processing
- **Webcam**: Frames captured via `getUserMedia`, sent to backend via WebSocket
- **Photo Upload**: Single image analysis for instant results
- **Counting**: Simple per-frame counting without tracking or directional logic

### Counting Modes
- **Simple Counting** (`app_local.py` and `app_deployment.py`): Current presence counting

## 🔧 Configuration

### Environment Variables
Create `.env.local` in frontend directory:
```
NEXT_PUBLIC_BACKEND_URL=https://your-huggingface-space.hf.space
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
Kenny Janson
