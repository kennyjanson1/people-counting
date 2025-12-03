# People Counting System - Real-time AI Detection

A modern web application for real-time people counting and gender classification using YOLO object detection. Monitor entry and exit counts with live analytics dashboard.

## Features

- **Real-time Detection**: Process live webcam feeds or pre-recorded video files
- **Gender Classification**: Detect and count male/female individuals separately
- **Entry/Exit Tracking**: Automatic detection of people crossing reference line
- **Live Statistics**: Real-time updating dashboard with FPS display
- **Responsive UI**: Works on desktop and mobile devices
- **Professional Analytics**: Color-coded statistics and intuitive visualizations

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Pre-built UI components
- **Lucide Icons** - Icon library

### Backend
- **FastAPI** - Python web framework
- **YOLO (Ultralytics)** - Object detection model
- **OpenCV** - Video processing
- **NumPy** - Numerical computing

## Project Structure

\`\`\`
.
├── app/
│   ├── page.tsx                 # Main home page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── api/
│   │   ├── process-video/route.ts
│   │   ├── stream/route.ts
│   │   └── health/route.ts
│   └── actions/
│       └── video-processing.ts  # Server actions
├── components/
│   ├── ui/                      # shadcn UI components
│   ├── video-input-selector.tsx # Input selection
│   ├── live-analytics.tsx       # Main analytics view
│   ├── video-renderer.tsx       # Video display with canvas
│   └── stats-dashboard.tsx      # Statistics cards
├── lib/
│   ├── detection-client.ts      # Backend communication
│   ├── yolo-processor.ts        # Detection utilities
│   ├── centroid-tracker.ts      # Object tracking
│   └── types.ts                 # TypeScript types
├── backend/
│   ├── app_fastapi.py           # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── run.sh                   # Backend startup script
└── public/                      # Static assets
\`\`\`

## Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Frontend Setup

\`\`\`bash
# Clone repository
git clone <repository-url>
cd people-counting-system

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
\`\`\`

Frontend runs on `http://localhost:3000`

### Backend Setup

\`\`\`bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Download YOLO model (first run)
python -c "from ultralytics import YOLO; YOLO('yolov8m.pt')"

# Start FastAPI server
python app_fastapi.py
\`\`\`

Backend runs on `http://localhost:5000`

## Configuration

### Environment Variables

Create `.env.local` in project root:

\`\`\`env
# Backend URL (adjust if running on different machine)
PYTHON_BACKEND_URL=http://localhost:5000

# Optional: For production deployments
NEXT_PUBLIC_API_URL=https://your-domain.com
\`\`\`

### YOLO Model Selection

In `backend/app_fastapi.py`, change the model:

\`\`\`python
# Options: yolov8n (nano), yolov8s (small), yolov8m (medium), yolov8l (large)
model = YOLO("yolov8m.pt")  # Default: medium model
\`\`\`

- **nano** (yolov8n): Fastest, lowest accuracy - ~80ms per frame
- **small** (yolov8s): Fast, good accuracy - ~100ms per frame
- **medium** (yolov8m): Balanced - ~130ms per frame
- **large** (yolov8l): Slower, best accuracy - ~200ms per frame

## Usage

### Option 1: Live Webcam Detection

1. Open `http://localhost:3000`
2. Click "Live Webcam"
3. Allow camera permissions
4. System automatically detects and counts people in real-time

### Option 2: Video File Processing

1. Open `http://localhost:3000`
2. Click "Upload Video"
3. Select MP4 video file from your device
4. Wait for processing to complete
5. View detailed statistics

## How It Works

### Detection Pipeline

1. **Video Input** → Browser captures webcam or user uploads video
2. **Frame Extraction** → Extract frames from video stream
3. **YOLO Detection** → Detect people with bounding boxes
4. **Gender Classification** → Classify each person (male/female)
5. **Centroid Tracking** → Track individuals across frames using centroid coordinates
6. **Line Crossing Detection** → Detect when person crosses reference line
7. **Statistics Update** → Update entry/exit counts and display

### Centroid Tracking Algorithm

- Calculates center point (centroid) of each detection bounding box
- Matches centroids between frames using distance calculation
- Tracks unique individuals with persistent IDs
- Handles occlusions and temporary disappearances

### Line Crossing Logic

- Reference line divides video into two zones
- Tracks each person's X position relative to line
- Registers entry/exit when person crosses line
- Includes cooldown (1.5s) to prevent multiple counts

## API Endpoints

### POST /api/detect
Process uploaded video file

\`\`\`bash
curl -X POST -F "video=@video.mp4" http://localhost:5000/api/detect
\`\`\`

Response:
\`\`\`json
{
  "maleIn": 5,
  "maleOut": 2,
  "femaleIn": 3,
  "femaleOut": 1,
  "currentCount": 5,
  "fps": 24.5,
  "duration": 120
}
\`\`\`

### GET /api/stream
Server-Sent Events (SSE) for real-time updates

\`\`\`bash
curl -N http://localhost:5000/api/stream
\`\`\`

### GET /api/health
Health check endpoint

\`\`\`bash
curl http://localhost:5000/api/health
\`\`\`

## Performance Tips

### For Better FPS

1. **Reduce Video Resolution**
   - Use 720p instead of 1080p for webcam
   - Reduces processing time

2. **Use Smaller Model**
   - Use yolov8n instead of yolov8l
   - ~2x faster but slightly less accurate

3. **GPU Acceleration**
   - Install CUDA for GPU support
   - ~5-10x faster than CPU

4. **Frame Skipping** (in backend)
   \`\`\`python
   # Process every 2nd frame
   if frame_count % 2 == 0:
       results = model(frame)
   \`\`\`

5. **Lower Confidence Threshold**
   \`\`\`python
   results = model(frame, conf=0.3)  # Default: 0.4
   \`\`\`

### For Better Accuracy

1. **Use Larger Model** (yolov8l)
2. **Higher Confidence Threshold** (0.5-0.6)
3. **Better Lighting** and camera angle
4. **Train Custom Model** on your specific use case

## Integration with Your YOLO Model

If you have a custom-trained YOLO model:

1. Place model file in `backend/` directory
   \`\`\`bash
   cp /path/to/kdandadult-model.pt backend/
   \`\`\`

2. Update `app_fastapi.py`:
   \`\`\`python
   model = YOLO("kdandadult-model.pt")
   CLASS_NAMES = ["Kid", "Adult"]  # Your class names
   \`\`\`

3. Restart backend server

## Troubleshooting

### Camera Permission Denied
- Check browser permissions for camera
- Try a different browser
- Refresh the page and allow again

### Backend Connection Error
- Ensure FastAPI server is running: `python app_fastapi.py`
- Check `PYTHON_BACKEND_URL` in `.env.local`
- Verify firewall allows localhost:5000

### Video Upload Fails
- Check file format (must be MP4)
- Ensure file size is reasonable (<2GB)
- Check available disk space

### Low FPS / Slow Processing
- Reduce video resolution
- Use smaller YOLO model (yolov8n)
- Enable GPU acceleration
- Close other applications

### Inaccurate Gender Classification
- Your YOLO model may need retraining
- Improve lighting conditions
- Adjust camera angle
- Use higher confidence threshold

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: Webcam access requires HTTPS in production (or localhost for development)

## Deployment

### Docker

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Vercel (Frontend)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Railway/Render (Backend)

1. Create FastAPI service
2. Set `PYTHON_BACKEND_URL` to backend service URL
3. Deploy

## Advanced Features (Future)

- [ ] Database integration (store statistics)
- [ ] Multiple camera support
- [ ] Real-time alerts and notifications
- [ ] Export data (CSV/PDF reports)
- [ ] Custom detection zones
- [ ] Person re-identification
- [ ] Age group classification
- [ ] Heatmap visualization

## License

MIT License - feel free to use for personal and commercial projects

## Support

For issues or questions:
1. Check Troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Enable debug logging in backend

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

**Made with ❤️ using Next.js + YOLO**
