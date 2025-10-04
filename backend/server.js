const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fatii'
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fatii')
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('Database: fatii');
})
.catch(err => {
  console.log('❌ MongoDB connection failed!');
  console.log('Error:', err.message);
  console.log('\n🔧 To fix this issue:');
  console.log('1. Install MongoDB Community Server from: https://www.mongodb.com/try/download/community');
  console.log('2. Or use MongoDB Atlas (free cloud database): https://www.mongodb.com/atlas');
  console.log('3. Or start your local MongoDB service');
  console.log('\n⚠️  The server will continue running but database features won\'t work until MongoDB is connected.');
});

// Routes
app.use('/api/auth', require('./route/auth'));
app.use('/api/quiz', require('./route/quizes'));
app.use('/api/subject', require('./route/subject'));
app.use('/api/audio', require('./route/audio'));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});