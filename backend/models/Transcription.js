const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  audio_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio',
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transcription', transcriptionSchema);