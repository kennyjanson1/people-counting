# Testing Guide

## Backend Testing

\`\`\`bash
cd backend
pytest tests/
\`\`\`

### Manual Testing

\`\`\`bash
# Test API endpoint
curl -X GET http://localhost:5000/api/health

# Test with video
curl -X POST -F "file=@test_video.mp4" http://localhost:5000/api/process-video
\`\`\`

## Frontend Testing

\`\`\`bash
npm run build
npm run start
\`\`\`

Visit `http://localhost:3000` and test:
1. Webcam access
2. Video upload
3. Theme toggle
4. Real-time updates
