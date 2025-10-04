const express = require('express');
const multer = require('multer');
const path = require('path');
const AudioService = require('../services/AudioService');
const Audio = require('../models/Audio');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/audio/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept audio and video files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for video files
  }
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  console.log('Auth check - Session:', req.session);
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - User ID:', req.session.userId);
  
  if (!req.session.userId) {
    console.log('Authentication failed - no userId in session');
    return res.status(401).json({ message: 'Authentication required' });
  }
  console.log('Authentication successful');
  next();
};

// Upload audio file - WAIT for transcription to complete
router.post('/upload', requireAuth, upload.single('audio'), async (req, res) => {
  let uploadedFilePath = null;
  
  try {
    console.log('=== UPLOAD REQUEST RECEIVED ===');
    
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error',
        message: 'No audio file provided' 
      });
    }

    uploadedFilePath = req.file.path;
    const { description } = req.body;
    const userId = req.session.userId;
    
    console.log('Processing upload for user:', userId);

    // Step 1: Create audio record and upload to Cloudinary
    console.log('Step 1: Creating audio record...');
    const result = await AudioService.createAudio(req.file, description, userId);
    const audioId = result.data.id;
    console.log('Audio created with ID:', audioId);
    
    // Step 2: Process audio (transcribe) and WAIT for it to complete
    console.log('Step 2: Starting transcription (this will take a moment)...');
    const audio = await Audio.findById(audioId);
    
    if (audio) {
      // WAIT for processing to complete
      await AudioService.processAudio(audio);
      console.log('Transcription complete!');
      
      // Step 3: Fetch the complete audio with transcription
      const completeAudio = await Audio.findById(audioId)
        .populate('tags', 'name')
        .populate('transcription', 'text')
        .populate('summary', 'summary_text');
      
      console.log('Sending complete audio with transcription');
      res.json({
        status: 'success',
        data: completeAudio
      });
    } else {
      throw new Error('Could not find audio record');
    }
    
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error:', error.message);
    
    // Clean up uploaded file if it exists
    if (uploadedFilePath) {
      try {
        const fs = require('fs');
        if (fs.existsSync(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Upload failed'
    });
  }
});

// Get user's audio files
router.get('/my-audios', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await AudioService.fetchAudioByUser(userId);
    res.json(result);
  } catch (error) {
    console.error('Fetch audios error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get audio statistics
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await AudioService.fetchStatistics(userId);
    res.json(result);
  } catch (error) {
    console.error('Fetch statistics error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific audio by ID
router.get('/:audioId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { audioId } = req.params;
    const result = await AudioService.fetchAudioById(userId, audioId);
    res.json(result);
  } catch (error) {
    console.error('Fetch audio error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete audio
router.delete('/:audioId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { audioId } = req.params;
    
    const audio = await Audio.findOne({ _id: audioId, user_id: userId });
    if (!audio) {
      return res.status(404).json({ message: 'Audio not found' });
    }

    await Audio.findByIdAndDelete(audioId);
    res.json({ status: 'success', message: 'Audio deleted successfully' });
  } catch (error) {
    console.error('Delete audio error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate todo list from audio transcription
router.post('/:audioId/generate-todos', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { audioId } = req.params;
    
    console.log('=== GENERATING TODO LIST ===');
    console.log('Audio ID:', audioId);
    console.log('User ID:', userId);
    
    // Fetch audio with transcription
    const audio = await Audio.findOne({ _id: audioId, user_id: userId })
      .populate('transcription', 'text');
    
    if (!audio) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Audio not found' 
      });
    }

    if (!audio.transcription || !audio.transcription.text) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Audio has no transcription available' 
      });
    }

    // Generate todo list using AutomaticService
    const AutomaticService = require('../services/AutomaticService');
    const result = await AutomaticService.generateTodoList(audio.transcription.text);
    
    console.log('Todo list generated successfully');
    res.json(result);
  } catch (error) {
    console.error('Generate todos error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// Generate image from audio transcription
router.post('/:audioId/generate-image', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { audioId } = req.params;
    
    console.log('=== GENERATING IMAGE FROM TRANSCRIPTION ===');
    console.log('Audio ID:', audioId);
    console.log('User ID:', userId);
    
    // Fetch audio with transcription
    const audio = await Audio.findOne({ _id: audioId, user_id: userId })
      .populate('transcription', 'text');
    
    if (!audio) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Audio not found' 
      });
    }

    if (!audio.transcription || !audio.transcription.text) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Audio has no transcription available' 
      });
    }

    // Generate image using AutomaticService
    const AutomaticService = require('../services/AutomaticService');
    const result = await AutomaticService.generateImageFromTranscription(audio.transcription.text);
    
    console.log('Image generated successfully');
    res.json(result);
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

module.exports = router;