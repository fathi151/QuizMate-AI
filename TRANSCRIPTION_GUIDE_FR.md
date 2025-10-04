# Guide Détaillé : Système de Transcription Audio/Vidéo

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Flux de traitement complet](#flux-de-traitement-complet)
4. [Technologies utilisées](#technologies-utilisées)
5. [Explication détaillée du code](#explication-détaillée-du-code)
6. [Comment intégrer la transcription](#comment-intégrer-la-transcription)
7. [Exemples d'utilisation](#exemples-dutilisation)

---

## 🎯 Vue d'ensemble

Votre projet utilise un système de transcription automatique qui convertit les fichiers audio et vidéo en texte, puis enrichit ce texte avec des métadonnées intelligentes (tags, résumé, mood, etc.).

### Fonctionnalités principales :
- ✅ **Transcription audio/vidéo** → Texte
- ✅ **Génération automatique de tags** et titre
- ✅ **Création de résumés** intelligents
- ✅ **Détection de l'humeur** (mood)
- ✅ **Génération de listes TODO** basées sur le contenu
- ✅ **Génération d'images** à partir de la transcription

---

## 🏗️ Architecture du système

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - AudioManager.js : Upload fichiers audio/vidéo            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Express)                       │
│  - Route: POST /api/audio/upload                            │
│  - Middleware: Multer (gestion upload fichiers)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AudioService.js (Service principal)             │
│  1. Upload vers Cloudinary                                   │
│  2. Transcription via AssemblyAI                            │
│  3. Traitement IA via AutomaticService                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│   AssemblyAI     │          │  AutomaticService    │
│  (Transcription) │          │  (IA - LLaMA 3.3)    │
│                  │          │  - Tags              │
│  Audio → Texte   │          │  - Titre             │
└──────────────────┘          │  - Résumé            │
                              │  - Mood              │
                              │  - TODO List         │
                              │  - Images            │
                              └──────────────────────┘
```

---

## 🔄 Flux de traitement complet

### Étape 1 : Upload du fichier
```javascript
// Frontend envoie le fichier
POST /api/audio/upload
Content-Type: multipart/form-data
Body: {
  audio: [fichier audio/vidéo],
  description: "Description du fichier"
}
```

### Étape 2 : Sauvegarde et upload Cloudinary
```javascript
// AudioService.createAudio()
1. Sauvegarde temporaire du fichier (uploads/audio/)
2. Calcul de la durée avec FFmpeg
3. Upload vers Cloudinary (stockage cloud)
4. Création de l'enregistrement dans MongoDB
5. Suppression du fichier temporaire
```

### Étape 3 : Transcription (AssemblyAI)
```javascript
// AudioService.audioTranscript()
1. Envoi de l'URL Cloudinary à AssemblyAI
2. AssemblyAI traite l'audio/vidéo
3. Polling toutes les 3 secondes pour vérifier l'état
4. Récupération du texte transcrit
```

### Étape 4 : Enrichissement IA (LLaMA)
```javascript
// AutomaticService.generateTagsTitle()
1. Envoi de la transcription à LLaMA 3.3
2. Génération de :
   - Titre descriptif
   - Tags pertinents
   - Mood (humeur)
   - Résumé
```

### Étape 5 : Sauvegarde finale
```javascript
// AudioService.processAudio()
1. Sauvegarde de la transcription (Transcription model)
2. Sauvegarde du résumé (Summary model)
3. Création/récupération des tags (Tag model)
4. Mise à jour de l'audio avec toutes les métadonnées
5. Changement du statut : pending → processing → ready
```

---

## 🛠️ Technologies utilisées

### 1. **AssemblyAI** (Transcription)
- **Rôle** : Convertit audio/vidéo en texte
- **Modèle** : "best" (meilleure précision)
- **Langues** : Anglais (configurable pour français)
- **Configuration** : `backend/config/assemblyAi.js`

```javascript
const { AssemblyAI } = require('assemblyai');
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});
```

### 2. **LLaMA 3.3** via OpenRouter (IA)
- **Rôle** : Analyse intelligente du texte
- **Modèle** : `meta-llama/llama-3.3-70b-instruct`
- **Fonctions** :
  - Génération de tags
  - Création de titres
  - Résumés
  - Détection d'humeur
  - Listes TODO

### 3. **Cloudinary** (Stockage)
- **Rôle** : Hébergement des fichiers audio/vidéo
- **Avantages** : URLs permanentes, streaming optimisé

### 4. **FFmpeg** (Métadonnées)
- **Rôle** : Extraction de la durée des fichiers
- **Fallback** : Estimation basée sur la taille si FFmpeg absent

### 5. **Multer** (Upload)
- **Rôle** : Gestion des uploads multipart/form-data
- **Limite** : 100MB par fichier
- **Formats acceptés** : audio/* et video/*

---

## 📝 Explication détaillée du code

### 1. Route d'upload (`backend/route/audio.js`)

```javascript
router.post('/upload', requireAuth, upload.single('audio'), async (req, res) => {
  // 1. Vérification du fichier
  if (!req.file) {
    return res.status(400).json({ message: 'No audio file provided' });
  }

  // 2. Création de l'audio (upload Cloudinary)
  const result = await AudioService.createAudio(req.file, description, userId);
  
  // 3. Transcription et traitement IA (ATTEND la fin)
  await AudioService.processAudio(audio);
  
  // 4. Retour de l'audio complet avec transcription
  res.json({ status: 'success', data: completeAudio });
});
```

**Points clés** :
- `requireAuth` : Vérifie que l'utilisateur est connecté
- `upload.single('audio')` : Multer gère l'upload
- `await processAudio()` : **Bloquant** - attend la fin de la transcription

---

### 2. Service Audio (`backend/services/AudioService.js`)

#### a) Création de l'audio
```javascript
async createAudio(audioFile, description, userId) {
  // 1. Vérifier que le fichier existe
  if (!fs.existsSync(audioPath)) {
    throw new Error('File not found');
  }
  
  // 2. Obtenir la durée
  const duration = await this.getAudioDuration(audioPath);
  
  // 3. Upload vers Cloudinary
  const uploadResult = await this.uploadAudio(audioPath);
  
  // 4. Créer l'enregistrement MongoDB
  const audio = new Audio({
    user_id: userId,
    file_url: uploadResult.data,
    description,
    duration,
    status: 'pending'
  });
  
  await audio.save();
  return { status: 'success', data: audio };
}
```

#### b) Transcription
```javascript
async audioTranscript(audioPath) {
  // 1. Configuration des paramètres
  const params = {
    audio: audioPath,           // URL Cloudinary
    language_code: 'en',        // Langue (en/fr)
    speech_model: "best",       // Modèle de qualité
    punctuate: true,            // Ponctuation automatique
    format_text: true           // Formatage du texte
  };
  
  // 2. Lancer la transcription
  const transcript = await client.transcripts.transcribe(params);
  
  // 3. Polling pour attendre la fin
  let completedTranscript;
  do {
    await new Promise(r => setTimeout(r, 3000)); // Attendre 3 secondes
    completedTranscript = await client.transcripts.get(transcript.id);
  } while (completedTranscript.status !== "completed");
  
  // 4. Retourner le texte
  return {
    status: 'success',
    text: completedTranscript.text
  };
}
```

**Pourquoi le polling ?**
- AssemblyAI traite de manière asynchrone
- Le temps dépend de la longueur du fichier
- On vérifie toutes les 3 secondes si c'est terminé

#### c) Traitement complet
```javascript
async processAudio(audio) {
  // 1. Mettre à jour le statut
  await Audio.findByIdAndUpdate(audio._id, { status: 'processing' });
  
  // 2. Transcription
  const transcriptResult = await this.audioTranscript(audio.file_url);
  const transcriptText = transcriptResult.text;
  
  // 3. Génération des métadonnées IA
  const taggingResult = await this.autoTagging(transcriptText);
  const { title, tags, mood, summary } = taggingResult.data;
  
  // 4. Créer/trouver les tags
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
  
  // 5. Sauvegarder la transcription
  const transcription = new Transcription({
    audio_id: audio._id,
    text: transcriptText
  });
  await transcription.save();
  
  // 6. Sauvegarder le résumé
  const summaryInstance = new Summary({
    audio_id: audio._id,
    summary_text: summary
  });
  await summaryInstance.save();
  
  // 7. Mettre à jour l'audio
  await Audio.findByIdAndUpdate(audio._id, {
    title,
    mood,
    status: 'ready',
    tags: tagInstances,
    transcription: transcription._id,
    summary: summaryInstance._id
  });
}
```

---

### 3. Service Automatique (`backend/services/AutomaticService.js`)

#### a) Génération de tags et métadonnées
```javascript
async generateTagsTitle(transcription) {
  // 1. Créer le prompt pour l'IA
  const prompt = `Analyze this audio transcription and respond ONLY with valid JSON:

Transcription: "${transcription}"

Respond with this exact JSON structure:
{
  "title": "A short descriptive title (max 50 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "mood": "positive/negative/neutral/excited/sad",
  "summary": "Brief summary (max 200 chars)"
}`;

  // 2. Appeler LLaMA
  let text = await this.callLlama(prompt);
  
  // 3. Nettoyer la réponse (enlever markdown)
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // 4. Parser le JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsedResult = JSON.parse(jsonMatch[0]);
  
  // 5. Retourner les données
  return {
    status: 'success',
    data: parsedResult
  };
}
```

#### b) Génération de TODO list
```javascript
async generateTodoList(transcription) {
  const prompt = `Based on this audio transcription, generate a practical to-do list:

Transcription: "${transcription}"

Respond ONLY with valid JSON:
{
  "todos": [
    {
      "task": "Clear, actionable task description",
      "priority": "high/medium/low",
      "category": "learning/action/research/practice"
    }
  ],
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}`;

  let text = await this.callLlama(prompt);
  // ... parsing similaire
}
```

#### c) Génération d'images
```javascript
async generateImageFromTranscription(transcription) {
  // 1. Générer un prompt d'image avec LLaMA
  const promptGenerationPrompt = `Based on this audio transcription, create a concise image prompt:
  
Transcription: "${transcription.substring(0, 500)}"

Respond with ONLY the image prompt text.`;

  const imagePrompt = await this.callLlama(promptGenerationPrompt);
  
  // 2. Générer l'image avec Pollinations.ai (gratuit)
  const encodedPrompt = encodeURIComponent(imagePrompt.trim());
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
  
  const response = await axios.get(pollinationsUrl, {
    responseType: 'arraybuffer'
  });
  
  // 3. Convertir en base64
  const imageBuffer = Buffer.from(response.data);
  const base64Image = imageBuffer.toString('base64');
  
  return {
    status: 'success',
    data: {
      imagePrompt: imagePrompt.trim(),
      imageBase64: base64Image,
      imageUrl: `data:image/png;base64,${base64Image}`
    }
  };
}
```

---

## 🔌 Comment intégrer la transcription

### Option 1 : Utiliser le système existant

Votre système est déjà intégré ! Il suffit d'uploader un fichier :

```javascript
// Frontend (React)
const handleUpload = async (file, description) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('description', description);
  
  const response = await fetch('http://localhost:5000/api/audio/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include' // Important pour les sessions
  });
  
  const result = await response.json();
  console.log('Transcription:', result.data.transcription.text);
  console.log('Tags:', result.data.tags);
  console.log('Résumé:', result.data.summary.summary_text);
};
```

---

### Option 2 : Ajouter la transcription à un nouveau composant

#### Étape 1 : Créer un nouveau composant React

```javascript
// src/components/VideoTranscriber.js
import React, { useState } from 'react';

function VideoTranscriber() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('description', 'Ma vidéo');

    try {
      const response = await fetch('http://localhost:5000/api/audio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setTranscription(result.data.transcription.text);
        alert('Transcription terminée !');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la transcription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Transcrire une vidéo/audio</h2>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept="audio/*,video/*" 
          onChange={handleFileChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Transcription en cours...' : 'Transcrire'}
        </button>
      </form>

      {transcription && (
        <div>
          <h3>Transcription :</h3>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}

export default VideoTranscriber;
```

#### Étape 2 : Ajouter le composant à votre App

```javascript
// src/App.js
import VideoTranscriber from './components/VideoTranscriber';

function App() {
  return (
    <div>
      <VideoTranscriber />
    </div>
  );
}
```

---

### Option 3 : Créer une nouvelle route API personnalisée

```javascript
// backend/route/custom-transcription.js
const express = require('express');
const router = express.Router();
const AudioService = require('../services/AudioService');

// Route simplifiée pour transcription uniquement
router.post('/transcribe-only', upload.single('audio'), async (req, res) => {
  try {
    // 1. Upload vers Cloudinary
    const uploadResult = await AudioService.uploadAudio(req.file.path);
    
    // 2. Transcription uniquement
    const transcriptResult = await AudioService.audioTranscript(uploadResult.data);
    
    // 3. Retourner juste le texte
    res.json({
      status: 'success',
      transcription: transcriptResult.text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : Transcription simple

```javascript
// Upload un fichier et obtenir la transcription
const file = document.getElementById('fileInput').files[0];
const formData = new FormData();
formData.append('audio', file);
formData.append('description', 'Mon cours de mathématiques');

const response = await fetch('/api/audio/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});

const data = await response.json();
console.log('Transcription:', data.data.transcription.text);
```

### Exemple 2 : Générer une TODO list

```javascript
// Après avoir uploadé un audio
const audioId = '507f1f77bcf86cd799439011';

const response = await fetch(`/api/audio/${audioId}/generate-todos`, {
  method: 'POST',
  credentials: 'include'
});

const result = await response.json();
console.log('TODOs:', result.data.todos);
console.log('Key Takeaways:', result.data.keyTakeaways);
```

### Exemple 3 : Générer une image

```javascript
const response = await fetch(`/api/audio/${audioId}/generate-image`, {
  method: 'POST',
  credentials: 'include'
});

const result = await response.json();
const imageUrl = result.data.imageUrl; // data:image/png;base64,...
document.getElementById('myImage').src = imageUrl;
```

---

## 🔧 Configuration requise

### Variables d'environnement (.env)

```env
# AssemblyAI (Transcription)
ASSEMBLYAI_API_KEY=votre_clé_assemblyai

# Cloudinary (Stockage)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/votre_db

# Session
SESSION_SECRET=votre_secret_session
```

### Installation des dépendances

```bash
# Backend
cd backend
npm install assemblyai @huggingface/inference axios cloudinary fluent-ffmpeg multer

# Frontend
cd ../
npm install
```

---

## 📊 Modèles de données

### Audio
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  file_url: String,        // URL Cloudinary
  description: String,
  duration: Number,        // en secondes
  title: String,           // Généré par IA
  mood: String,            // positive/negative/neutral
  status: String,          // pending/processing/ready/error
  tags: [ObjectId],        // Références aux tags
  transcription: ObjectId, // Référence à Transcription
  summary: ObjectId,       // Référence à Summary
  createdAt: Date
}
```

### Transcription
```javascript
{
  _id: ObjectId,
  audio_id: ObjectId,
  text: String,            // Texte complet de la transcription
  createdAt: Date
}
```

### Summary
```javascript
{
  _id: ObjectId,
  audio_id: ObjectId,
  summary_text: String,    // Résumé généré par IA
  createdAt: Date
}
```

### Tag
```javascript
{
  _id: ObjectId,
  name: String,            // Nom du tag
  createdAt: Date
}
```

---

## 🚀 Améliorations possibles

### 1. Support multilingue
```javascript
// Modifier dans AudioService.js
const params = {
  audio: audioPath,
  language_code: 'fr', // Changer en français
  // ...
};
```

### 2. Transcription en temps réel
- Utiliser WebSocket pour le streaming
- Afficher la transcription au fur et à mesure

### 3. Sous-titres pour vidéos
- Utiliser les timestamps d'AssemblyAI
- Générer des fichiers SRT/VTT

### 4. Recherche dans les transcriptions
```javascript
// Ajouter un index de recherche
router.get('/search', async (req, res) => {
  const { query } = req.query;
  const transcriptions = await Transcription.find({
    text: { $regex: query, $options: 'i' }
  });
  res.json(transcriptions);
});
```

---

## 🐛 Dépannage

### Problème : "Transcription timeout"
**Solution** : Augmenter le nombre de polls
```javascript
pollCount < 200 // Au lieu de 100
```

### Problème : "FFmpeg not found"
**Solution** : Le système utilise un fallback automatique basé sur la taille du fichier

### Problème : "AssemblyAI API error"
**Solution** : Vérifier que `ASSEMBLYAI_API_KEY` est défini dans `.env`

### Problème : "Cloudinary upload failed"
**Solution** : Vérifier les credentials Cloudinary dans `.env`

---

## 📚 Ressources

- [Documentation AssemblyAI](https://www.assemblyai.com/docs)
- [Documentation LLaMA](https://ai.meta.com/llama/)
- [Documentation Cloudinary](https://cloudinary.com/documentation)
- [Documentation Multer](https://github.com/expressjs/multer)

---

## ✅ Résumé

Votre système de transcription fonctionne en **5 étapes** :

1. **Upload** : Le fichier est uploadé via Multer
2. **Stockage** : Le fichier est sauvegardé sur Cloudinary
3. **Transcription** : AssemblyAI convertit l'audio en texte
4. **Enrichissement** : LLaMA génère tags, titre, résumé, mood
5. **Sauvegarde** : Tout est stocké dans MongoDB

Le système est **entièrement automatique** et **bloquant** (attend la fin de la transcription avant de répondre).

Pour l'intégrer ailleurs, il suffit d'appeler l'API `/api/audio/upload` avec un fichier audio ou vidéo !
