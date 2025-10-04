const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  audio_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio',
    required: true
  },
  summary_text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Summary', summarySchema);