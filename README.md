# 🎓 Quiz & Audio Learning Platform

A modern educational platform combining quiz management with AI-powered audio processing. Students take quizzes while teachers upload audio lectures that are automatically transcribed and analyzed by AI.

## ✨ Features

### Quiz System
- Create and manage quizzes with multiple-choice questions
- Organize by subjects
- Timed quizzes with instant feedback
- Search and filter functionality
- Progress tracking

### AI Audio Processing
- **Upload Audio/Voice Recording** - Upload MP3 files or record directly from browser
- **AI Transcription** - Automatic speech-to-text using AssemblyAI
- **AI Analysis** - Auto-generate title, tags, mood, and summary using LLaMA 3.3
- **AI Image Generation** - Create images from transcription content
- **AI Todo List** - Extract actionable tasks with priorities

## 🚀 Quick Start

### Prerequisites
- Node.js, MongoDB, npm

### Installation
```bash
# Clone repository
git clone <your-repo-url>
cd quiz-audio-platform

# Install dependencies
npm install
cd backend && npm install

# Setup .env file with API keys
MONGODB_URI=mongodb://localhost:27017/quiz_db
ASSEMBLYAI_API_KEY=your_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
OPENROUTER_API_KEY=your_key

# Run application
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend && npm start

# Terminal 3: Start Frontend
npm start
```

App runs on `http://localhost:3000`

## 🛠️ Tech Stack

**Frontend:** React, React Router, Axios  
**Backend:** Node.js, Express, MongoDB, Mongoose  
**AI Services:** AssemblyAI (transcription), OpenRouter/LLaMA 3.3 (analysis), Pollinations.ai (images)  
**Storage:** Cloudinary

## 📁 Project Structure

```
├── backend/
│   ├── models/          # Database models
│   ├── route/           # API routes
│   ├── services/        # AI services
│   └── server.js
├── src/
│   ├── components/      # React components
│   ├── App.js
│   └── App.css
└── package.json
```

## 🎯 Usage

**Students:** Browse quizzes → Take quiz → View results  
**Teachers:** Create quizzes → Upload audio → AI processes → View transcription/summary/images/todos

## 🔑 API Keys Required

- [AssemblyAI](https://www.assemblyai.com/) - Speech-to-text
- [Cloudinary](https://cloudinary.com/) - Audio storage
- [OpenRouter](https://openrouter.ai/) - AI analysis

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for education**
