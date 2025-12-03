# People Counting System - Setup Guide

## Architecture Overview

Sistem ini terdiri dari 3 bagian utama:
1. **Frontend (React + Next.js)** - UI untuk input selection dan live analytics
2. **Backend API (Next.js API Routes)** - Gateway untuk komunikasi dengan Python
3. **Python Backend (FastAPI)** - YOLO detection dan processing

## Installation & Setup

### 1. Setup Frontend (React + Next.js)

\`\`\`bash
# Install dependencies (sudah ada di project)
npm install

# Run development server
npm run dev
\`\`\`

Frontend akan berjalan di `http://localhost:3000`

### 2. Setup Python Backend

\`\`\`bash
# Navigate ke backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server
python app_fastapi.py
\`\`\`

FastAPI backend akan berjalan di `http://localhost:5000`

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

\`\`\`env
# Backend API URL
PYTHON_BACKEND_URL=http://localhost:5000
\`\`\`

## How to Use

### Option 1: Live Webcam Detection
1. Buka http://localhost:3000
2. Klik "Live Webcam"
3. Allow camera access
4. Sistem akan mulai detect dan count people secara real-time

### Option 2: Video File Processing
1. Buka http://localhost:3000
2. Klik "Upload Video"
3. Pilih video MP4 dari komputer
4. Tunggu proses selesai
5. Lihat hasil statistik

## Integration dengan app.py Anda

Backend FastAPI yang disediakan adalah wrapper untuk YOLO model Anda. Anda bisa:

### Option A: Replace app.py dengan FastAPI
- Ganti Python app.py dengan app_fastapi.py
- Update model path sesuai lokasi model Anda

### Option B: Wrap app.py dengan FastAPI
\`\`\`python
# Modify app_fastapi.py untuk import functions dari app.py Anda
from app import CentroidTracker, process_detections
\`\`\`

### Option C: Parallel Servers
- Jalankan app.py di port berbeda
- Ubah PYTHON_BACKEND_URL di .env.local

## API Endpoints

### POST /api/detect
Upload video file untuk processing
\`\`\`bash
curl -X POST -F "video=@video.mp4" http://localhost:5000/api/detect
\`\`\`

### GET /api/stream
Server-Sent Events (SSE) untuk real-time updates
\`\`\`bash
curl -N http://localhost:5000/api/stream
\`\`\`

### POST /api/webcam-start
Start webcam streaming
\`\`\`bash
curl -X POST http://localhost:5000/api/webcam-start
\`\`\`

## Response Format

Detection response mengandung:
\`\`\`json
{
  "maleIn": 5,
  "maleOut": 2,
  "femaleIn": 3,
  "femaleOut": 1,
  "currentCount": 8,
  "fps": 24.5,
  "timestamp": 1701234567890
}
\`\`\`

## Troubleshooting

### Camera tidak bekerja
- Check browser permissions
- Pastikan tidak ada aplikasi lain yang pakai camera
- Try refresh halaman

### Backend connection error
- Pastikan FastAPI server running di localhost:5000
- Check PYTHON_BACKEND_URL di .env.local
- Check CORS configuration

### Video tidak process
- Pastikan format MP4 supported
- Check file size tidak terlalu besar
- Lihat error di console untuk detail

## Performance Optimization

1. **GPU Acceleration** - YOLO sudah optimize untuk GPU (CUDA)
2. **Frame Skip** - Untuk webcam, bisa skip frames untuk FPS lebih tinggi
3. **Model Size** - Gunakan YOLOv8n (nano) untuk lebih cepat, atau YOLOv8l untuk accuracy lebih tinggi

## Next Steps

1. Customize gender classification (sekarang hanya Kid/Adult)
2. Tambah database untuk menyimpan statistics
3. Add export functionality (CSV/PDF)
4. Implement real-time alerts
5. Add multiple camera support
