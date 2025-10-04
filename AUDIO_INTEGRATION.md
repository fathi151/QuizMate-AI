# Audio Integration Documentation

## Overview
This document describes the audio functionality that has been integrated into your EduQuiz Pro application. The system allows users to upload audio files, automatically transcribe them, generate tags and summaries using AI, and manage their audio library.

## Features Added

### 1. Audio Upload & Processing
- Upload audio files (supports various audio formats)
- Automatic transcription using AssemblyAI
- AI-powered tagging and summarization using Google Gemini
- Cloud storage using Cloudinary

### 2. Audio Management
- View all uploaded audio files
- Audio statistics dashboard
- Detailed audio information with transcription and summary
- Audio playback functionality
- Delete audio files

### 3. AI-Powered Features
- Automatic transcription of audio content
- Smart tagging based on content analysis
- Mood detection (positive, negative, neutral, etc.)
- Content summarization

## Files Added/Modified

### Backend Files
- `backend/config/cloudinary.js` - Cloudinary configuration
- `backend/config/assemblyAi.js` - AssemblyAI configuration
- `backend/models/Audio.js` - Audio data model
- `backend/models/Tag.js` - Tag data model
- `backend/models/Transcription.js` - Transcription data model
- `backend/models/Summary.js` - Summary data model
- `backend/services/AudioService.js` - Main audio processing service
- `backend/services/AutomaticService.js` - AI-powered analysis service
- `backend/route/audio.js` - Audio API routes
- `backend/server.js` - Updated to include audio routes

### Frontend Files
- `src/components/AudioManager.js` - Audio management interface
- `src/App.js` - Updated to include audio routes
- `src/components/navbar.js` - Added audio navigation link
- `src/App.css` - Updated with navbar styles

### Configuration Files
- `.env` - Added Cloudinary and AssemblyAI configuration
- `package.json` - Added required dependencies

## Environment Variables Required

Add these to your `.env` file:

```env
# Cloudinary Configuration (Already added)
CLOUDINARY_CLOUD_NAME=dxmxdfmtp
CLOUDINARY_API_KEY=362938967721396
CLOUDINARY_API_SECRET=7v2nXG5czSPRmMlC5K1RxgmL5m8

# AssemblyAI Configuration (You need to get this)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

## Setup Instructions

### 1. Get AssemblyAI API Key
1. Go to [AssemblyAI](https://www.assemblyai.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Replace `your_assemblyai_api_key_here` in the `.env` file

### 2. Install Dependencies
Dependencies have been added to package.json and installed:
- `assemblyai` - For audio transcription
- `cloudinary` - For cloud storage
- `fluent-ffmpeg` - For audio processing
- `multer` - For file uploads
- `@google/generative-ai` - For AI-powered analysis

### 3. Start the Application
```bash
npm start
```

## API Endpoints

### Audio Routes (`/api/audio`)
- `POST /upload` - Upload audio file
- `GET /my-audios` - Get user's audio files
- `GET /statistics` - Get audio statistics
- `GET /:audioId` - Get specific audio details
- `DELETE /:audioId` - Delete audio file

## Usage

### 1. Upload Audio
1. Navigate to the Audio Manager page
2. Click on the file input to select an audio file
3. The file will be uploaded and processing will begin automatically

### 2. View Audio Library
- All uploaded audio files are displayed in a list
- Each audio shows title, description, tags, and status
- Click "View Details" to see full information including transcription and summary

### 3. Audio Statistics
The dashboard shows:
- Total audio files
- Audio files uploaded today
- Audio files uploaded this week
- Pending audio files (being processed)

### 4. Audio Processing Flow
1. File upload to temporary storage
2. Duration extraction using FFmpeg
3. Upload to Cloudinary for permanent storage
4. Transcription using AssemblyAI
5. AI analysis for tags, title, mood, and summary using Google Gemini
6. Database storage of all processed data

## Technical Details

### Database Schema (MongoDB)
- **Audio**: Main audio document with metadata
- **Tag**: Reusable tags for categorization
- **Transcription**: Audio transcription text
- **Summary**: AI-generated summary

### File Processing
- Temporary files stored in `backend/uploads/audio/`
- Permanent storage on Cloudinary
- Automatic cleanup of temporary files

### AI Integration
- **AssemblyAI**: Handles audio-to-text transcription
- **Google Gemini**: Generates tags, titles, mood analysis, and summaries

## Security Features
- User authentication required for all audio operations
- File type validation (audio files only)
- File size limits (50MB max)
- User isolation (users can only access their own audio)

## Error Handling
- Comprehensive error handling for upload failures
- Graceful degradation if AI services are unavailable
- Status tracking for processing stages
- User-friendly error messages

## Future Enhancements
- Audio editing capabilities
- Batch upload functionality
- Advanced search and filtering
- Audio sharing between users
- Export functionality for transcriptions
- Integration with quiz generation from audio content

## Troubleshooting

### Common Issues
1. **Upload fails**: Check file format and size
2. **Transcription fails**: Verify AssemblyAI API key
3. **AI analysis fails**: Check Google Gemini API key
4. **Storage fails**: Verify Cloudinary configuration

### Logs
Check the server console for detailed error messages during processing.