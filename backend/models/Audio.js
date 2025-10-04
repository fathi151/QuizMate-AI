const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  file_url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  mood: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'error'],
    default: 'pending'
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  transcription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcription'
  },
  summary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Summary'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Audio', audioSchema);