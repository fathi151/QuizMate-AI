import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AudioManager = () => {
  const [audios, setAudios] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingAudioId, setProcessingAudioId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoList, setTodoList] = useState(null);
  const [generatingTodos, setGeneratingTodos] = useState(false);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    fetchAudios();
    fetchStatistics();
  }, []);

  const fetchAudios = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/audio/my-audios', {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setAudios(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching audios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/audio/statistics', {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const pollAudioStatus = async (audioId) => {
    const maxAttempts = 60; // Poll for up to 3 minutes (60 * 3 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/audio/${audioId}`, {
          withCredentials: true
        });

        if (response.data.status === 'success') {
          const audio = response.data.data;
          
          if (audio.status === 'ready') {
            // Processing complete! Show the details
            setProcessingStatus('Processing complete!');
            setSelectedAudio(audio);
            setProcessingAudioId(null);
            fetchAudios();
            fetchStatistics();
            return;
          } else if (audio.status === 'error') {
            setProcessingStatus('Processing failed');
            setProcessingAudioId(null);
            alert('Audio processing failed. Please try again.');
            return;
          } else if (audio.status === 'processing') {
            setProcessingStatus('Transcribing audio...');
          } else if (audio.status === 'pending') {
            setProcessingStatus('Waiting to process...');
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000); // Poll every 3 seconds
        } else {
          setProcessingStatus('Processing is taking longer than expected...');
          setProcessingAudioId(null);
        }
      } catch (error) {
        console.error('Error polling audio status:', error);
        setProcessingAudioId(null);
      }
    };

    poll();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('description', 'Audio upload');

    setUploading(true);
    setProcessingStatus('Uploading and transcribing... This may take a minute.');
    
    try {
      const response = await axios.post('http://localhost:5000/api/audio/upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minute timeout for transcription
      });

      if (response.data.status === 'success') {
        // We got the complete audio with transcription!
        const audioData = response.data.data;
        setProcessingStatus('Complete!');
        setSelectedAudio(audioData);
        fetchAudios();
        fetchStatistics();
        
        // Clear status after a moment
        setTimeout(() => {
          setProcessingStatus('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Error uploading audio: ' + (error.response?.data?.message || error.message));
      setProcessingStatus('');
    } finally {
      setUploading(false);
    }
  };

  const fetchAudioDetails = async (audioId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/audio/${audioId}`, {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setSelectedAudio(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching audio details:', error);
    }
  };

  const deleteAudio = async (audioId) => {
    if (!window.confirm('Are you sure you want to delete this audio?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/audio/${audioId}`, {
        withCredentials: true
      });
      alert('Audio deleted successfully!');
      fetchAudios();
      fetchStatistics();
      setSelectedAudio(null);
    } catch (error) {
      console.error('Error deleting audio:', error);
      alert('Error deleting audio: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return '#28a745';
      case 'processing': return '#ffc107';
      case 'pending': return '#17a2b8';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const generateTodoList = async (audioId) => {
    setGeneratingTodos(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/audio/${audioId}/generate-todos`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.status === 'success') {
        setTodoList(response.data.data);
        setCompletedTodos([]);
        setShowTodoModal(true);
      }
    } catch (error) {
      console.error('Error generating todo list:', error);
      alert('Error generating todo list: ' + (error.response?.data?.message || error.message));
    } finally {
      setGeneratingTodos(false);
    }
  };

  const toggleTodoComplete = (index) => {
    if (completedTodos.includes(index)) {
      setCompletedTodos(completedTodos.filter(i => i !== index));
    } else {
      setCompletedTodos([...completedTodos, index]);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'learning': return '📚';
      case 'action': return '⚡';
      case 'research': return '🔍';
      case 'practice': return '💪';
      default: return '📝';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioChunks(chunks);

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const uploadRecording = async (audioBlob) => {
    const formData = new FormData();
    const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
    formData.append('audio', audioFile);
    formData.append('description', 'Voice recording');

    setUploading(true);
    setProcessingStatus('Processing your recording...');

    try {
      const response = await axios.post('http://localhost:5000/api/audio/upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000
      });

      if (response.data.status === 'success') {
        const audioData = response.data.data;
        setProcessingStatus('Complete!');
        setSelectedAudio(audioData);
        fetchAudios();
        fetchStatistics();
        
        setTimeout(() => {
          setProcessingStatus('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      alert('Error uploading recording: ' + (error.response?.data?.message || error.message));
      setProcessingStatus('');
    } finally {
      setUploading(false);
      setRecordingTime(0);
    }
  };

  const generateImage = async (audioId) => {
    setGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/audio/${audioId}/generate-image`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.status === 'success') {
        setGeneratedImage(response.data.data);
      } else {
        alert('Error generating image: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image: ' + (error.response?.data?.message || error.message));
    } finally {
      setGeneratingImage(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="audio-manager">Loading...</div>;
  }

  return (
    <div className="audio-manager">
      <h2>Audio Manager</h2>
      
      {/* Statistics */}
      <div className="statistics">
        <div className="stat-card">
          <h3>Total Audios</h3>
          <p>{statistics.audioTotal || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Today</h3>
          <p>{statistics.audioToday || 0}</p>
        </div>
        <div className="stat-card">
          <h3>This Week</h3>
          <p>{statistics.audioThisWeek || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{statistics.audioPending || 0}</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h3>Upload Audio</h3>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading || processingAudioId || isRecording}
        />
        {(uploading || processingStatus) && (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p className="status-message">{processingStatus || 'Uploading...'}</p>
          </div>
        )}
      </div>

      {/* Voice Recording Section */}
      <div className="recording-section">
        <h3>🎤 Record Your Voice</h3>
        <p className="recording-description">Click the button below to start recording your speech</p>
        
        <div className="recording-controls">
          {!isRecording ? (
            <button 
              className="record-btn"
              onClick={startRecording}
              disabled={uploading}
            >
              <span className="mic-icon">🎤</span>
              Start Recording
            </button>
          ) : (
            <div className="recording-active">
              <div className="recording-indicator">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
                <span className="recording-dot"></span>
              </div>
              <div className="recording-info">
                <p className="recording-text">Recording...</p>
                <p className="recording-timer">{formatTime(recordingTime)}</p>
              </div>
              <button 
                className="stop-btn"
                onClick={stopRecording}
              >
                <span className="stop-icon">⏹</span>
                Stop Recording
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audio List */}
      <div className="audio-content">
        <div className="audio-list">
          <h3>Your Audios</h3>
          {audios.length === 0 ? (
            <p>No audios uploaded yet.</p>
          ) : (
            audios.map(audio => (
              <div key={audio._id} className="audio-item">
                <div className="audio-info">
                  <h4>{audio.title || 'Untitled'}</h4>
                  <p>{audio.description}</p>
                  <small>Created: {formatDate(audio.createdAt)}</small>
                  <div className="audio-tags">
                    {audio.tags && audio.tags.map(tag => (
                      <span key={tag._id} className="tag">{tag.name}</span>
                    ))}
                  </div>
                </div>
                <div className="audio-actions">
                  <span 
                    className="status"
                    style={{ color: getStatusColor(audio.status) }}
                  >
                    {audio.status}
                  </span>
                  <button onClick={() => fetchAudioDetails(audio._id)}>
                    View Details
                  </button>
                  <button 
                    onClick={() => deleteAudio(audio._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Audio Details */}
        {selectedAudio && (
          <div className="audio-details">
            <h3>Audio Details</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedAudio(null)}
            >
              ×
            </button>
            
            <div className="detail-section">
              <h4>Basic Info</h4>
              <p><strong>Title:</strong> {selectedAudio.title || 'Untitled'}</p>
              <p><strong>Description:</strong> {selectedAudio.description}</p>
              <p><strong>Duration:</strong> {selectedAudio.duration} seconds</p>
              <p><strong>Mood:</strong> {selectedAudio.mood || 'Not analyzed'}</p>
              <p><strong>Status:</strong> {selectedAudio.status}</p>
            </div>

            {selectedAudio.tags && selectedAudio.tags.length > 0 && (
              <div className="detail-section">
                <h4>Tags</h4>
                <div className="tags-list">
                  {selectedAudio.tags.map(tag => (
                    <span key={tag._id} className="tag">{tag.name}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedAudio.transcription && (
              <div className="detail-section">
                <h4>Transcription</h4>
                <p>{selectedAudio.transcription.text}</p>
              </div>
            )}

            {selectedAudio.summary && (
              <div className="detail-section">
                <h4>Summary</h4>
                <p>{selectedAudio.summary.summary_text}</p>
              </div>
            )}

            {selectedAudio.file_url && (
              <div className="detail-section">
                <h4>Audio Player</h4>
                <audio controls>
                  <source src={selectedAudio.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {selectedAudio.transcription && (
              <>
                <div className="detail-section">
                  <button 
                    className="todo-btn"
                    onClick={() => generateTodoList(selectedAudio._id)}
                    disabled={generatingTodos}
                  >
                    {generatingTodos ? (
                      <>
                        <div className="spinner-small"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        ✨ Generate To-Do List
                      </>
                    )}
                  </button>
                </div>

                <div className="detail-section">
                  <button 
                    className="image-btn"
                    onClick={() => generateImage(selectedAudio._id)}
                    disabled={generatingImage}
                  >
                    {generatingImage ? (
                      <>
                        <div className="spinner-small"></div>
                        Generating Image...
                      </>
                    ) : (
                      <>
                        🎨 Generate Image from Transcription
                      </>
                    )}
                  </button>
                  
                  {generatedImage && (
                    <div className="generated-image-container">
                      <h4>Generated Image</h4>
                      <p className="image-prompt"><strong>Prompt:</strong> {generatedImage.imagePrompt}</p>
                      <img 
                        src={generatedImage.imageUrl} 
                        alt="Generated from transcription" 
                        className="generated-image"
                      />
                      <button 
                        className="download-btn"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedImage.imageUrl;
                          link.download = `transcription-image-${Date.now()}.png`;
                          link.click();
                        }}
                      >
                        💾 Download Image
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Todo List Modal */}
      {showTodoModal && todoList && (
        <div className="modal-overlay" onClick={() => setShowTodoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Action Items & To-Do List</h2>
              <button className="modal-close" onClick={() => setShowTodoModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Key Takeaways */}
              {todoList.keyTakeaways && todoList.keyTakeaways.length > 0 && (
                <div className="takeaways-section">
                  <h3>🎯 Key Takeaways</h3>
                  <ul className="takeaways-list">
                    {todoList.keyTakeaways.map((takeaway, index) => (
                      <li key={index}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Todo List */}
              <div className="todos-section">
                <h3>✅ Action Items</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(completedTodos.length / todoList.todos.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="progress-text">
                  {completedTodos.length} of {todoList.todos.length} completed
                </p>
                
                <div className="todos-list">
                  {todoList.todos.map((todo, index) => (
                    <div 
                      key={index} 
                      className={`todo-item ${completedTodos.includes(index) ? 'completed' : ''}`}
                    >
                      <div className="todo-checkbox">
                        <input
                          type="checkbox"
                          checked={completedTodos.includes(index)}
                          onChange={() => toggleTodoComplete(index)}
                          id={`todo-${index}`}
                        />
                        <label htmlFor={`todo-${index}`}></label>
                      </div>
                      <div className="todo-content">
                        <div className="todo-task">{todo.task}</div>
                        <div className="todo-meta">
                          <span className="todo-category">
                            {getCategoryIcon(todo.category)} {todo.category}
                          </span>
                          <span 
                            className="todo-priority"
                            style={{ color: getPriorityColor(todo.priority) }}
                          >
                            {todo.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTodoModal(false)}>
                Close
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  const text = todoList.todos.map((t, i) => 
                    `${i + 1}. [${t.priority.toUpperCase()}] ${t.task} (${t.category})`
                  ).join('\n');
                  navigator.clipboard.writeText(text);
                  alert('To-do list copied to clipboard!');
                }}
              >
                📋 Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .audio-manager {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .statistics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #dee2e6;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 14px;
        }

        .stat-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }

        .upload-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .upload-section h3 {
          margin-top: 0;
        }

        .upload-section input {
          margin-bottom: 10px;
        }

        /* Recording Section */
        .recording-section {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          color: white;
          box-shadow: 0 8px 24px rgba(245, 87, 108, 0.3);
        }

        .recording-section h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }

        .recording-description {
          margin: 0 0 20px 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .recording-controls {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .record-btn {
          padding: 16px 32px;
          background: white;
          color: #f5576c;
          border: none;
          border-radius: 50px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .record-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .record-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mic-icon {
          font-size: 24px;
        }

        .recording-active {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .recording-indicator {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid white;
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }

        .pulse-ring.delay-1 {
          animation-delay: 0.5s;
        }

        .pulse-ring.delay-2 {
          animation-delay: 1s;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .recording-dot {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          animation: blink 1s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .recording-info {
          text-align: center;
        }

        .recording-text {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .recording-timer {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .stop-btn {
          padding: 14px 28px;
          background: white;
          color: #f5576c;
          border: none;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .stop-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .stop-icon {
          font-size: 20px;
        }

        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding: 10px;
          background: #e7f3ff;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }

        .status-message {
          color: #007bff;
          font-weight: 500;
          margin: 0;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .audio-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .audio-list {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
        }

        .audio-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 15px;
          border-bottom: 1px solid #eee;
        }

        .audio-item:last-child {
          border-bottom: none;
        }

        .audio-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .audio-info p {
          margin: 0 0 5px 0;
          color: #666;
          font-size: 14px;
        }

        .audio-info small {
          color: #999;
          font-size: 12px;
        }

        .audio-tags {
          margin-top: 8px;
        }

        .tag {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-right: 5px;
        }

        .audio-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: flex-end;
        }

        .status {
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
        }

        .audio-actions button {
          padding: 5px 10px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .delete-btn {
          background: #dc3545 !important;
          border-color: #dc3545 !important;
        }

        .audio-details {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          position: relative;
          max-height: 600px;
          overflow-y: auto;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }

        .detail-section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .detail-section:last-child {
          border-bottom: none;
        }

        .detail-section h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .detail-section p {
          margin: 5px 0;
          line-height: 1.5;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        audio {
          width: 100%;
          margin-top: 10px;
        }

        /* Todo Button */
        .todo-btn {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .todo-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .todo-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-small {
          border: 2px solid #ffffff40;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 0.8s linear infinite;
        }

        /* Image Generation Button */
        .image-btn {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
          margin-bottom: 15px;
        }

        .image-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
        }

        .image-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Generated Image Container */
        .generated-image-container {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
          border-radius: 12px;
          animation: slideIn 0.5s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .generated-image-container h4 {
          margin: 0 0 10px 0;
          color: #2d3436;
          font-size: 18px;
        }

        .image-prompt {
          margin: 0 0 15px 0;
          padding: 10px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          font-size: 14px;
          color: #2d3436;
          line-height: 1.5;
        }

        .generated-image {
          width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          margin-bottom: 15px;
          display: block;
        }

        .download-btn {
          width: 100%;
          padding: 10px 20px;
          background: white;
          color: #f5576c;
          border: 2px solid #f5576c;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .download-btn:hover {
          background: #f5576c;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 24px;
          border-bottom: 2px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: white;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .takeaways-section {
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
          border-radius: 12px;
        }

        .takeaways-section h3 {
          margin: 0 0 15px 0;
          color: #2d3436;
          font-size: 20px;
        }

        .takeaways-list {
          margin: 0;
          padding-left: 20px;
        }

        .takeaways-list li {
          margin-bottom: 10px;
          color: #2d3436;
          line-height: 1.6;
          font-weight: 500;
        }

        .todos-section h3 {
          margin: 0 0 15px 0;
          color: #2d3436;
          font-size: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .todos-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .todo-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .todo-item:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .todo-item.completed {
          opacity: 0.6;
          background: #e8f5e9;
        }

        .todo-item.completed .todo-task {
          text-decoration: line-through;
        }

        .todo-checkbox {
          flex-shrink: 0;
        }

        .todo-checkbox input[type="checkbox"] {
          display: none;
        }

        .todo-checkbox label {
          display: block;
          width: 24px;
          height: 24px;
          border: 2px solid #667eea;
          border-radius: 6px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }

        .todo-checkbox input[type="checkbox"]:checked + label {
          background: #667eea;
        }

        .todo-checkbox input[type="checkbox"]:checked + label::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 16px;
          font-weight: bold;
        }

        .todo-content {
          flex: 1;
        }

        .todo-task {
          font-size: 16px;
          color: #2d3436;
          margin-bottom: 8px;
          line-height: 1.5;
          font-weight: 500;
        }

        .todo-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .todo-category {
          font-size: 13px;
          padding: 4px 10px;
          background: white;
          border-radius: 12px;
          color: #666;
          font-weight: 500;
        }

        .todo-priority {
          font-size: 13px;
          padding: 4px 10px;
          background: white;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 2px solid #f0f0f0;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        @media (max-width: 768px) {
          .audio-content {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95%;
            max-height: 95vh;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .modal-body {
            padding: 16px;
          }

          .modal-footer {
            flex-direction: column;
          }

          .btn-primary, .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioManager;