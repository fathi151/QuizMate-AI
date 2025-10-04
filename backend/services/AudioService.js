const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const Audio = require('../models/Audio');
const Tag = require('../models/Tag');
const Transcription = require('../models/Transcription');
const Summary = require('../models/Summary');
const ffmpeg = require('fluent-ffmpeg');
const client = require('../config/assemblyAi');
const AutomaticService = require('./AutomaticService');

// Try to configure FFmpeg paths
try {
  // Common FFmpeg installation paths on Windows
  const possiblePaths = [
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
    process.env.FFMPEG_PATH || 'ffmpeg'
  ];
  
  // Set FFmpeg path if found
  ffmpeg.setFfmpegPath(possiblePaths[possiblePaths.length - 1]);
  ffmpeg.setFfprobePath(possiblePaths[possiblePaths.length - 1].replace('ffmpeg.exe', 'ffprobe.exe'));
} catch (error) {
  console.warn('Could not configure FFmpeg paths:', error.message);
}

class AudioService {
  async uploadAudio(filePath) {
    try {
      console.log('Uploading to Cloudinary:', filePath);
      console.log('File exists:', fs.existsSync(filePath));
      
      // Check if cloudinary is configured
      if (!cloudinary.config().cloud_name) {
        throw new Error('Cloudinary not configured. Check your .env file.');
      }
      
      console.log('Cloudinary config:', {
        cloud_name: cloudinary.config().cloud_name,
        api_key: cloudinary.config().api_key ? 'SET' : 'NOT SET'
      });
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video', // works for audio
        folder: 'mediaFlow/audio', // organize uploads in dashboard
      });

      console.log('Cloudinary upload successful:', result.secure_url);

      // Cleanup local file
      try {
        fs.unlinkSync(filePath);
        console.log('Local file cleaned up');
      } catch (cleanupError) {
        console.warn('Could not delete local file:', cleanupError.message);
      }

      return {
        status: 'success',
        data: result.secure_url,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Upload failed: ' + (error.message || JSON.stringify(error)));
    }
  }

  getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      try {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            console.warn('FFmpeg not found, estimating duration from file size:', err.message);
            // Estimate duration based on file size (rough approximation)
            // Average audio bitrate ~128kbps = 16KB/s
            try {
              const stats = fs.statSync(filePath);
              const fileSizeInBytes = stats.size;
              const estimatedDuration = Math.max(30, Math.floor(fileSizeInBytes / 16000)); // minimum 30 seconds
              console.log(`Estimated duration: ${estimatedDuration} seconds for file size: ${fileSizeInBytes} bytes`);
              resolve(estimatedDuration);
            } catch (fsError) {
              console.warn('Could not read file stats, using default duration:', fsError.message);
              resolve(60); // Default 60 seconds
            }
            return;
          }
          resolve(Math.floor(metadata.format.duration));
        });
      } catch (error) {
        console.warn('Error initializing ffprobe, using default duration:', error.message);
        resolve(60); // Default 60 seconds
      }
    });
  }

  async createAudio(audioFile, description, userId) {
    try {
      console.log('Creating audio with file:', audioFile);
      console.log('User ID:', userId);
      console.log('Description:', description);
      
      const audioPath = audioFile.path;
      console.log('Audio path:', audioPath);
      
      // Check if file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error('Uploaded file not found at path: ' + audioPath);
      }
      
      console.log('Getting audio duration...');
      const duration = await this.getAudioDuration(audioPath);
      console.log('Duration:', duration);
      
      console.log('Uploading to Cloudinary...');
      const uploadResult = await this.uploadAudio(audioPath);
      console.log('Upload result:', uploadResult);

      console.log('Creating audio record in database...');
      const audio = new Audio({
        user_id: userId,
        file_url: uploadResult.data,
        description,
        duration,
        status: 'pending',
      });

      await audio.save();
      console.log('Audio saved successfully with ID:', audio._id);

      return {
        status: 'success',
        data: {
          id: audio._id,
          url: uploadResult.data,
          description,
          duration,
          userId,
        },
      };
    } catch (error) {
      console.error('Audio creation error:', error);
      // Clean up file if it exists
      if (audioFile && audioFile.path && fs.existsSync(audioFile.path)) {
        try {
          fs.unlinkSync(audioFile.path);
          console.log('Cleaned up temporary file:', audioFile.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      throw new Error('Audio creation failed: ' + error.message);
    }
  }

  async audioTranscript(audioPath) {
    const params = {
      audio: audioPath,
      language_code: 'en', // English - change to 'fr' for French
      speech_model: "best", // Use 'best' model for better accuracy
      punctuate: true,
      format_text: true,
    };
    try {
      console.log('Starting transcription with params:', params);
      const transcript = await client.transcripts.transcribe(params);
      console.log('Transcription job created:', transcript.id);

      // Poll for completion
      let completedTranscript;
      let pollCount = 0;
      do {
        await new Promise(r => setTimeout(r, 3000));
        completedTranscript = await client.transcripts.get(transcript.id);
        pollCount++;
        console.log(`Poll ${pollCount}: Transcription status: ${completedTranscript.status}`);
      } while (
        completedTranscript.status !== "completed" &&
        completedTranscript.status !== "error" &&
        pollCount < 100 // Add max poll limit to prevent infinite loop
      );

      if (completedTranscript.status === "error") {
        console.error('Transcription error:', completedTranscript.error);
        throw new Error("Transcription failed: " + completedTranscript.error);
      }

      if (pollCount >= 100) {
        throw new Error("Transcription timeout: took too long to complete");
      }

      console.log('Transcription completed successfully');
      console.log('Transcript text:', completedTranscript.text);
      console.log('Transcript text length:', completedTranscript.text?.length || 0);

      return {
        status: 'success',
        text: completedTranscript.text
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Transcription failed: ' + error.message);
    }
  }

  async autoTagging(transcription) {
    try {
      const result = await AutomaticService.generateTagsTitle(transcription);
      return {
        status: 'success',
        data: result.data,
      };
    } catch (error) {
      throw new Error('Tagging failed: ' + error.message);
    }
  }

  async processAudio(audio) {
    try {
      console.log(`Starting to process audio ${audio._id}`);
      console.log(`Audio file URL: ${audio.file_url}`);
      
      // Update status to processing
      await Audio.findByIdAndUpdate(audio._id, { status: 'processing' });
      console.log(`Updated audio ${audio._id} status to processing`);

      console.log(`Starting transcription for audio ${audio._id}`);
      const transcriptResult = await this.audioTranscript(audio.file_url);
      console.log(`Transcription result:`, transcriptResult);
      
      if (!transcriptResult || transcriptResult.status !== 'success' || !transcriptResult.text) {
        console.error(`Transcription failed for audio ${audio._id}:`, transcriptResult);
        await Audio.findByIdAndUpdate(audio._id, { status: 'error' });
        return;
      
      
      }

      const transcriptText = transcriptResult.text;
      const taggingResult = await this.autoTagging(transcriptText);
      const { title, tags, mood, summary } = taggingResult.data;

      // Create or find tags
      const tagInstances = await Promise.all(
        tags.map(async tagName => {
          let tag = await Tag.findOne({ name: tagName });
          if (!tag) {
            tag = new Tag({ name: tagName });
            await tag.save();
          }
          return tag._id;
        })
      );

      // Create or update transcription
      let transcription = await Transcription.findOne({ audio_id: audio._id });
      if (transcription) {
        transcription.text = transcriptText;
        await transcription.save();
      } else {
        transcription = new Transcription({
          audio_id: audio._id,
          text: transcriptText
        });
        await transcription.save();
      }

      // Create or update summary
      let summaryInstance = await Summary.findOne({ audio_id: audio._id });
      if (summaryInstance) {
        summaryInstance.summary_text = summary;
        await summaryInstance.save();
      } else {
        summaryInstance = new Summary({
          audio_id: audio._id,
          summary_text: summary
        });
        await summaryInstance.save();
      }

      // Update audio with processed data
      await Audio.findByIdAndUpdate(audio._id, {
        title,
        mood,
        status: 'ready',
        tags: tagInstances,
        transcription: transcription._id,
        summary: summaryInstance._id
      });

    } catch (err) {
      console.error(`Error processing audio ${audio._id}:`, err.message);
      await Audio.findByIdAndUpdate(audio._id, { status: 'error' });
    }
  }

  async fetchAudioByUser(userId) {
    try {
      const audios = await Audio.find({ user_id: userId })
        .select('_id description title createdAt')
        .populate('tags', 'name')
        .sort({ createdAt: -1 });

      return {
        status: 'success',
        data: audios,
      };
    } catch (error) {
      throw new Error('Fetch audio failed: ' + error.message);
    }
  }

  async fetchStatistics(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [audioToday, audioTotal, audioPending, audioThisWeek] = await Promise.all([
        Audio.countDocuments({
          user_id: userId,
          createdAt: { $gte: today }
        }),
        Audio.countDocuments({ user_id: userId }),
        Audio.countDocuments({ user_id: userId, status: 'pending' }),
        Audio.countDocuments({
          user_id: userId,
          createdAt: { $gte: weekAgo }
        })
      ]);

      return {
        status: 'success',
        data: {
          audioToday: audioToday || 0,
          audioTotal: audioTotal || 0,
          audioPending: audioPending || 0,
          audioThisWeek: audioThisWeek || 0
        },
      };
    } catch (error) {
      console.error('Fetch statistics error:', error);
      throw new Error('Fetch statistics failed: ' + error.message);
    }
  }

  async fetchAudioById(userId, audioId) {
    try {
      const audio = await Audio.findOne({ _id: audioId, user_id: userId })
        .populate('tags', 'name')
        .populate('transcription', 'text')
        .populate('summary', 'summary_text');

      if (!audio) {
        return { status: 'error', message: 'Audio not found' };
      }

      return {
        status: 'success',
        data: audio,
      };
    } catch (error) {
      throw new Error('Fetch audio failed: ' + error.message);
    }
  }
}

module.exports = new AudioService();