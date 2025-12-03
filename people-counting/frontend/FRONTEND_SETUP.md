# People Counting System - Frontend Setup Guide

## Prerequisites

- Node.js 18+ (with npm or yarn)
- Modern web browser

## Installation Steps

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Create Environment File
Create a `.env.local` file:
\`\`\`
BACKEND_URL=http://localhost:5000
\`\`\`

### 3. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

The application will be available at: `http://localhost:3000`

## Features

- **Live Webcam Detection**: Real-time detection using your camera
- **Video Upload**: Process pre-recorded MP4 videos
- **Gender Classification**: Automatic male/female detection
- **Entry/Exit Counting**: Track people movement across a reference line
- **Real-time Statistics**: Live dashboard with gender breakdown
- **Dark/Light Mode**: Toggle between dark and light themes

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Python backend API URL | http://localhost:5000 |

## Troubleshooting

### Camera Permission Denied
- Check browser camera permissions
- Try a different browser
- Reload the page

### Backend Connection Error
- Ensure backend is running on `http://localhost:5000`
- Check firewall settings
- Verify `BACKEND_URL` in `.env.local`

### Performance Issues
- Close other browser tabs
- Reduce video resolution
- Use a GPU-enabled backend

## Building for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

## Deployment

The frontend can be deployed to Vercel, Netlify, or any Node.js hosting:

\`\`\`bash
npm run build
# Upload the .next folder to your hosting provider
