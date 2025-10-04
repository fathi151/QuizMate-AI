require('dotenv').config({ path: '../.env' });
const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('Testing Cloudinary upload...');
    console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    
    // Find an existing audio file to test
    const uploadsDir = path.join(__dirname, 'uploads', 'audio');
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('No test files found in uploads/audio/');
      return;
    }
    
    const testFile = path.join(uploadsDir, files[0]);
    console.log('Testing with file:', testFile);
    console.log('File exists:', fs.existsSync(testFile));
    
    const result = await cloudinary.uploader.upload(testFile, {
      resource_type: 'video',
      folder: 'mediaFlow/audio',
    });
    
    console.log('Upload successful!');
    console.log('URL:', result.secure_url);
    
  } catch (error) {
    console.error('Upload failed:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
  }
}

testUpload();
