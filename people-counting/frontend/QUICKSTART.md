# Quick Start Guide - People Counting System

## Setup in 5 Minutes

### Terminal 1: Start Backend
\`\`\`bash
cd backend
bash run.sh
\`\`\`

Backend will start on: `http://localhost:5000`

### Terminal 2: Start Frontend
\`\`\`bash
npm install
npm run dev
\`\`\`

Frontend will start on: `http://localhost:3000`

### Open in Browser
Go to: `http://localhost:3000`

## First Run

1. **Select Input**:
   - Click "Live Webcam" for real-time detection
   - Or "Upload Video" to process a video file

2. **Grant Permissions**:
   - Allow browser camera access if using webcam

3. **View Results**:
   - Watch detection boxes appear on video
   - Stats update in real-time on the right side
   - Male/Female counts tracked automatically

## Understanding the Dashboard

| Metric | Description |
|--------|-------------|
| **Total Entry** | Number of people who entered the zone |
| **Total Exit** | Number of people who left the zone |
| **Current Count** | People currently in the detection zone |
| **Male/Female Stats** | Gender breakdown for entries and exits |
| **FPS** | Processing speed (frames per second) |

## Adjusting Detection

Edit `backend/app.py` to fine-tune:
- **Confidence threshold**: Change `conf=0.4` to `conf=0.5` (higher = stricter)
- **Line position**: Change `line_position = frame_width // 2` to adjust crossing detection
- **Max disappeared frames**: Change `max_disappeared=80` for tracking sensitivity

## Need Help?

1. Check backend logs for errors
2. Ensure gender-cls.pt is in backend folder
3. Verify camera/file permissions
4. Check .env files are configured correctly
