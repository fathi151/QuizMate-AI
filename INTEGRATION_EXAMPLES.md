# Exemples Pratiques d'Intégration de la Transcription

## 🎯 Cas d'usage réels

### 1. Application de prise de notes vocales

```javascript
// src/components/VoiceNotes.js
import React, { useState } from 'react';

function VoiceNotes() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [notes, setNotes] = useState([]);

  // Démarrer l'enregistrement
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      await uploadAndTranscribe(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // Upload et transcription
  const uploadAndTranscribe = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-note.webm');
    formData.append('description', 'Note vocale');

    try {
      const response = await fetch('http://localhost:5000/api/audio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setNotes([...notes, {
          id: result.data._id,
          title: result.data.title,
          transcription: result.data.transcription.text,
          tags: result.data.tags,
          date: new Date()
        }]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="voice-notes">
      <h2>Notes Vocales</h2>
      
      <div className="recorder">
        {!recording ? (
          <button onClick={startRecording} className="btn-record">
            🎤 Commencer l'enregistrement
          </button>
        ) : (
          <button onClick={stopRecording} className="btn-stop">
            ⏹️ Arrêter et transcrire
          </button>
        )}
      </div>

      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="note-card">
            <h3>{note.title}</h3>
            <p className="date">{note.date.toLocaleString()}</p>
            <div className="tags">
              {note.tags.map(tag => (
                <span key={tag._id} className="tag">{tag.name}</span>
              ))}
            </div>
            <p className="transcription">{note.transcription}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoiceNotes;
```

---

### 2. Sous-titrage automatique de vidéos

```javascript
// src/components/VideoSubtitler.js
import React, { useState } from 'react';

function VideoSubtitler() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [subtitles, setSubtitles] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  const generateSubtitles = async () => {
    setProcessing(true);

    const formData = new FormData();
    formData.append('audio', videoFile);
    formData.append('description', 'Vidéo pour sous-titrage');

    try {
      const response = await fetch('http://localhost:5000/api/audio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        const transcriptionText = result.data.transcription.text;
        
        // Convertir en format SRT (simplifié)
        const srtContent = convertToSRT(transcriptionText);
        setSubtitles(srtContent);
        
        // Télécharger le fichier SRT
        downloadSRT(srtContent, 'subtitles.srt');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setProcessing(false);
    }
  };

  const convertToSRT = (text) => {
    // Diviser le texte en phrases
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let srt = '';
    
    sentences.forEach((sentence, index) => {
      const startTime = index * 3; // 3 secondes par phrase (approximatif)
      const endTime = startTime + 3;
      
      srt += `${index + 1}\n`;
      srt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srt += `${sentence.trim()}\n\n`;
    });
    
    return srt;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const ms = 0;
    
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
  };

  const pad = (num, size = 2) => {
    return String(num).padStart(size, '0');
  };

  const downloadSRT = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="video-subtitler">
      <h2>Sous-titrage Automatique</h2>
      
      <div className="upload-section">
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleVideoUpload}
        />
        
        {videoUrl && (
          <div className="video-preview">
            <video src={videoUrl} controls width="100%" />
          </div>
        )}
        
        {videoFile && !processing && (
          <button onClick={generateSubtitles} className="btn-generate">
            Générer les sous-titres
          </button>
        )}
        
        {processing && (
          <div className="processing">
            <p>⏳ Génération des sous-titres en cours...</p>
            <p>Cela peut prendre quelques minutes selon la longueur de la vidéo.</p>
          </div>
        )}
      </div>

      {subtitles && (
        <div className="subtitles-result">
          <h3>Sous-titres générés (format SRT)</h3>
          <pre>{subtitles}</pre>
          <button onClick={() => downloadSRT(subtitles, 'subtitles.srt')}>
            📥 Télécharger les sous-titres
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoSubtitler;
```

---

### 3. Analyseur de réunions

```javascript
// src/components/MeetingAnalyzer.js
import React, { useState } from 'react';

function MeetingAnalyzer() {
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeMeeting = async (audioFile) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('description', 'Enregistrement de réunion');

    try {
      // 1. Upload et transcription
      const uploadResponse = await fetch('http://localhost:5000/api/audio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const uploadResult = await uploadResponse.json();
      const audioId = uploadResult.data._id;

      // 2. Générer la TODO list
      const todoResponse = await fetch(`http://localhost:5000/api/audio/${audioId}/generate-todos`, {
        method: 'POST',
        credentials: 'include'
      });

      const todoResult = await todoResponse.json();

      // 3. Combiner les données
      setMeetingData({
        title: uploadResult.data.title,
        date: new Date(uploadResult.data.createdAt),
        transcription: uploadResult.data.transcription.text,
        summary: uploadResult.data.summary.summary_text,
        mood: uploadResult.data.mood,
        tags: uploadResult.data.tags,
        todos: todoResult.data.todos,
        keyTakeaways: todoResult.data.keyTakeaways
      });

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'analyse de la réunion');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      analyzeMeeting(file);
    }
  };

  const exportReport = () => {
    if (!meetingData) return;

    const report = `
RAPPORT DE RÉUNION
==================

Titre: ${meetingData.title}
Date: ${meetingData.date.toLocaleString()}
Humeur générale: ${meetingData.mood}

RÉSUMÉ
------
${meetingData.summary}

POINTS CLÉS
-----------
${meetingData.keyTakeaways.map((item, i) => `${i + 1}. ${item}`).join('\n')}

ACTIONS À FAIRE
---------------
${meetingData.todos.map((todo, i) => 
  `${i + 1}. [${todo.priority.toUpperCase()}] ${todo.task} (${todo.category})`
).join('\n')}

TRANSCRIPTION COMPLÈTE
----------------------
${meetingData.transcription}

TAGS
----
${meetingData.tags.map(tag => tag.name).join(', ')}
    `;

    // Télécharger le rapport
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reunion-${meetingData.date.toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="meeting-analyzer">
      <h2>📊 Analyseur de Réunions</h2>
      
      {!meetingData && !loading && (
        <div className="upload-zone">
          <label className="file-input-label">
            <input 
              type="file" 
              accept="audio/*,video/*" 
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="upload-button">
              📁 Sélectionner l'enregistrement de la réunion
            </div>
          </label>
          <p className="hint">Formats acceptés: MP3, WAV, MP4, etc.</p>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyse en cours...</p>
          <p className="sub-text">
            Transcription, génération du résumé et extraction des actions à faire
          </p>
        </div>
      )}

      {meetingData && (
        <div className="meeting-report">
          <div className="report-header">
            <h3>{meetingData.title}</h3>
            <p className="date">{meetingData.date.toLocaleString()}</p>
            <span className={`mood-badge mood-${meetingData.mood}`}>
              {meetingData.mood}
            </span>
          </div>

          <div className="report-section">
            <h4>📝 Résumé</h4>
            <p>{meetingData.summary}</p>
          </div>

          <div className="report-section">
            <h4>💡 Points Clés</h4>
            <ul>
              {meetingData.keyTakeaways.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="report-section">
            <h4>✅ Actions à Faire</h4>
            <div className="todos">
              {meetingData.todos.map((todo, i) => (
                <div key={i} className={`todo-item priority-${todo.priority}`}>
                  <input type="checkbox" id={`todo-${i}`} />
                  <label htmlFor={`todo-${i}`}>
                    <span className="priority-badge">{todo.priority}</span>
                    <span className="task">{todo.task}</span>
                    <span className="category">{todo.category}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>🏷️ Tags</h4>
            <div className="tags">
              {meetingData.tags.map(tag => (
                <span key={tag._id} className="tag">{tag.name}</span>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>📄 Transcription Complète</h4>
            <div className="transcription-box">
              {meetingData.transcription}
            </div>
          </div>

          <div className="report-actions">
            <button onClick={exportReport} className="btn-export">
              📥 Exporter le rapport
            </button>
            <button onClick={() => setMeetingData(null)} className="btn-new">
              🔄 Nouvelle analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingAnalyzer;
```

**CSS pour MeetingAnalyzer** :
```css
/* src/components/MeetingAnalyzer.css */
.meeting-analyzer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.upload-zone {
  text-align: center;
  padding: 60px 20px;
  border: 2px dashed #ccc;
  border-radius: 10px;
  background: #f9f9f9;
}

.upload-button {
  display: inline-block;
  padding: 15px 30px;
  background: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.upload-button:hover {
  background: #0056b3;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.meeting-report {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 30px;
}

.report-header {
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.mood-badge {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.mood-positive { background: #d4edda; color: #155724; }
.mood-negative { background: #f8d7da; color: #721c24; }
.mood-neutral { background: #d1ecf1; color: #0c5460; }

.report-section {
  margin-bottom: 30px;
}

.report-section h4 {
  color: #333;
  margin-bottom: 15px;
}

.todos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
  border-left: 4px solid #ccc;
}

.todo-item.priority-high {
  border-left-color: #dc3545;
}

.todo-item.priority-medium {
  border-left-color: #ffc107;
}

.todo-item.priority-low {
  border-left-color: #28a745;
}

.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  margin-right: 10px;
  text-transform: uppercase;
}

.transcription-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  display: inline-block;
  padding: 5px 15px;
  background: #007bff;
  color: white;
  border-radius: 20px;
  font-size: 14px;
}

.report-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.btn-export, .btn-new {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-export {
  background: #28a745;
  color: white;
}

.btn-export:hover {
  background: #218838;
}

.btn-new {
  background: #6c757d;
  color: white;
}

.btn-new:hover {
  background: #5a6268;
}
```

---

### 4. Recherche dans les transcriptions

```javascript
// src/components/TranscriptionSearch.js
import React, { useState, useEffect } from 'react';

function TranscriptionSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchTranscriptions = async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      // Récupérer tous les audios de l'utilisateur
      const response = await fetch('http://localhost:5000/api/audio/my-audios', {
        credentials: 'include'
      });

      const audiosResult = await response.json();
      
      if (audiosResult.status === 'success') {
        // Filtrer les audios qui contiennent le terme de recherche
        const filtered = [];
        
        for (const audio of audiosResult.data) {
          // Récupérer les détails complets avec transcription
          const detailResponse = await fetch(
            `http://localhost:5000/api/audio/${audio._id}`,
            { credentials: 'include' }
          );
          
          const detailResult = await detailResponse.json();
          
          if (detailResult.status === 'success' && detailResult.data.transcription) {
            const transcriptionText = detailResult.data.transcription.text.toLowerCase();
            const searchTerm = query.toLowerCase();
            
            if (transcriptionText.includes(searchTerm)) {
              // Extraire le contexte autour du terme trouvé
              const index = transcriptionText.indexOf(searchTerm);
              const start = Math.max(0, index - 100);
              const end = Math.min(transcriptionText.length, index + searchTerm.length + 100);
              const context = detailResult.data.transcription.text.substring(start, end);
              
              filtered.push({
                ...detailResult.data,
                context,
                matchIndex: index
              });
            }
          }
        }
        
        setResults(filtered);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTranscriptions(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i}>{part}</mark> : part
    );
  };

  return (
    <div className="transcription-search">
      <h2>🔍 Recherche dans les Transcriptions</h2>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Rechercher dans vos transcriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {loading && <span className="search-loading">⏳</span>}
      </div>

      <div className="search-results">
        {results.length > 0 ? (
          <>
            <p className="results-count">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </p>
            
            {results.map(result => (
              <div key={result._id} className="result-card">
                <h3>{result.title}</h3>
                <p className="result-date">
                  {new Date(result.createdAt).toLocaleDateString()}
                </p>
                <div className="result-context">
                  ...{highlightText(result.context, searchQuery)}...
                </div>
                <div className="result-tags">
                  {result.tags.map(tag => (
                    <span key={tag._id} className="tag">{tag.name}</span>
                  ))}
                </div>
                <a href={`/audio/${result._id}`} className="view-link">
                  Voir la transcription complète →
                </a>
              </div>
            ))}
          </>
        ) : searchQuery && !loading ? (
          <p className="no-results">Aucun résultat trouvé pour "{searchQuery}"</p>
        ) : null}
      </div>
    </div>
  );
}

export default TranscriptionSearch;
```

---

## 🔧 Backend : Nouvelle route pour recherche optimisée

```javascript
// backend/route/audio.js - Ajouter cette route

// Recherche dans les transcriptions (optimisée)
router.get('/search', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { q } = req.query; // query parameter

    if (!q || q.trim().length < 2) {
      return res.json({
        status: 'success',
        data: []
      });
    }

    // Recherche avec MongoDB text search (plus rapide)
    const audios = await Audio.find({ user_id: userId })
      .populate('transcription', 'text')
      .populate('tags', 'name')
      .populate('summary', 'summary_text');

    // Filtrer côté serveur
    const results = audios.filter(audio => {
      if (!audio.transcription || !audio.transcription.text) return false;
      
      const text = audio.transcription.text.toLowerCase();
      const query = q.toLowerCase();
      
      return text.includes(query) || 
             audio.title?.toLowerCase().includes(query) ||
             audio.summary?.summary_text?.toLowerCase().includes(query);
    });

    // Ajouter le contexte pour chaque résultat
    const enrichedResults = results.map(audio => {
      const text = audio.transcription.text;
      const query = q.toLowerCase();
      const index = text.toLowerCase().indexOf(query);
      
      let context = '';
      if (index !== -1) {
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + q.length + 100);
        context = text.substring(start, end);
      }
      
      return {
        ...audio.toObject(),
        context,
        matchIndex: index
      };
    });

    res.json({
      status: 'success',
      data: enrichedResults,
      count: enrichedResults.length
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
```

---

## 📱 Application Mobile (React Native)

```javascript
// MobileVoiceRecorder.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

function MobileVoiceRecorder() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    // Upload et transcription
    await uploadAndTranscribe(uri);
    setRecording(null);
  };

  const uploadAndTranscribe = async (audioUri) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });
    formData.append('description', 'Enregistrement mobile');

    try {
      const response = await fetch('http://your-server.com/api/audio/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('Transcription:', result.data.transcription.text);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enregistreur Vocal</Text>
      
      <TouchableOpacity
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '⏹️ Arrêter' : '🎤 Enregistrer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 50,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRecording: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MobileVoiceRecorder;
```

---

## 🎓 Cas d'usage : Plateforme d'apprentissage

```javascript
// src/components/LearningPlatform.js
import React, { useState } from 'react';

function LearningPlatform() {
  const [courses, setCourses] = useState([]);

  const uploadCourseVideo = async (videoFile, courseTitle) => {
    const formData = new FormData();
    formData.append('audio', videoFile);
    formData.append('description', courseTitle);

    try {
      // 1. Upload et transcription
      const uploadResponse = await fetch('http://localhost:5000/api/audio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const uploadResult = await uploadResponse.json();
      const audioId = uploadResult.data._id;

      // 2. Générer TODO list (exercices suggérés)
      const todoResponse = await fetch(
        `http://localhost:5000/api/audio/${audioId}/generate-todos`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      const todoResult = await todoResponse.json();

      // 3. Générer une image illustrative
      const imageResponse = await fetch(
        `http://localhost:5000/api/audio/${audioId}/generate-image`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      const imageResult = await imageResponse.json();

      // 4. Créer le cours complet
      const course = {
        id: audioId,
        title: uploadResult.data.title,
        videoUrl: uploadResult.data.file_url,
        transcription: uploadResult.data.transcription.text,
        summary: uploadResult.data.summary.summary_text,
        exercises: todoResult.data.todos,
        keyPoints: todoResult.data.keyTakeaways,
        thumbnail: imageResult.data.imageUrl,
        tags: uploadResult.data.tags,
        duration: uploadResult.data.duration
      };

      setCourses([...courses, course]);
      alert('Cours créé avec succès !');

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du cours');
    }
  };

  return (
    <div className="learning-platform">
      <h1>📚 Plateforme d'Apprentissage</h1>
      
      <div className="upload-course">
        <h2>Ajouter un nouveau cours</h2>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files[0];
            const title = prompt('Titre du cours :');
            if (file && title) {
              uploadCourseVideo(file, title);
            }
          }}
        />
      </div>

      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <img src={course.thumbnail} alt={course.title} />
            <h3>{course.title}</h3>
            <p className="duration">⏱️ {Math.floor(course.duration / 60)} min</p>
            <p className="summary">{course.summary}</p>
            
            <div className="tags">
              {course.tags.map(tag => (
                <span key={tag._id} className="tag">{tag.name}</span>
              ))}
            </div>

            <div className="key-points">
              <h4>Points clés :</h4>
              <ul>
                {course.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="exercises">
              <h4>Exercices suggérés :</h4>
              {course.exercises.map((exercise, i) => (
                <div key={i} className="exercise">
                  <input type="checkbox" id={`ex-${course.id}-${i}`} />
                  <label htmlFor={`ex-${course.id}-${i}`}>
                    {exercise.task}
                  </label>
                </div>
              ))}
            </div>

            <button className="btn-view-course">
              Voir le cours complet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningPlatform;
```

---

## 🚀 Déploiement et Production

### Configuration pour la production

```javascript
// backend/config/production.js
module.exports = {
  // Augmenter les limites pour la production
  uploadLimits: {
    fileSize: 500 * 1024 * 1024, // 500MB
    maxFiles: 10
  },
  
  // Configuration de cache pour les transcriptions
  cache: {
    enabled: true,
    ttl: 3600 // 1 heure
  },
  
  // Queue pour traitement asynchrone
  queue: {
    enabled: true,
    concurrency: 5 // 5 transcriptions en parallèle
  }
};
```

### Utilisation d'une queue (Bull)

```javascript
// backend/services/TranscriptionQueue.js
const Queue = require('bull');
const AudioService = require('./AudioService');

const transcriptionQueue = new Queue('transcription', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Traiter les jobs
transcriptionQueue.process(async (job) => {
  const { audioId } = job.data;
  
  const audio = await Audio.findById(audioId);
  await AudioService.processAudio(audio);
  
  return { success: true, audioId };
});

// Ajouter un job
const addTranscriptionJob = async (audioId) => {
  await transcriptionQueue.add({ audioId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
};

module.exports = { transcriptionQueue, addTranscriptionJob };
```

---

Ces exemples montrent comment intégrer la transcription dans différents contextes. Tous utilisent la même API backend que vous avez déjà !
