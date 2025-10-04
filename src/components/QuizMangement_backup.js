import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubjectManager from './SubjectManager';
import { isEditable } from '@testing-library/user-event/dist/utils';

const QuizManager = ({ onUpdate }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 30,
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [generatingPdf, setGeneratingPdf] = useState(null);

  useEffect(() => {
    fetchQuizzes();
    fetchSubjects();
  }, []);

  // Simple validation check
  const checkField = (name, value) => {
    let newErrors = { ...errors };
    
    if (name === 'title') {
      if (!value) newErrors.title = 'Le titre est requis';
      else if (value.length < 8) newErrors.title = 'Le titre doit contenir au moins 8 caractères';
      else delete newErrors.title;
    }
    
    if (name === 'description') {
      if (!value) newErrors.description = 'La description est requise';
      else if (value.length < 8) newErrors.description = 'La description doit contenir au moins 8 caractères';
      else delete newErrors.description;
    }
    
    if (name === 'subject') {
      if (!value) newErrors.subject = 'Le sujet est requis';
      else delete newErrors.subject;
    }
    
    if (name === 'duration') {
      if (!value || value < 1) newErrors.duration = 'La durée doit être d\'au moins 1 minute';
      else delete newErrors.duration;
    }
    
    setErrors(newErrors);
  };

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/quiz/getQuizz');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subject/Subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if(editingQuiz==null)
      {
const response = await axios.post('http://localhost:5000/api/quiz/createQuizz', formData);
      }
      else{
const response=await axios.put('http://localhost:5000/api/quiz/update/${editingQuiz._id}', formData)

      }
      resetForm();
      fetchQuizzes();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating quiz:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data.details && Array.isArray(data.details)) {
          setError(data.details.join(' • '));
        } else if (status === 400 && data.error) {
          setError(data.error);
        } else if (status === 401) {
          setError('Vous devez être connecté pour créer un quiz');
        } else if (status === 403) {
          setError('Vous n\'avez pas les permissions nécessaires pour créer un quiz');
        } else {
          setError(data.error || data.message || 'Erreur lors de la création du quiz');
        }
      } else if (error.request) {
        setError('Erreur de connexion au serveur');
      } else {
        setError('Une erreur inattendue s\'est produite');
      }
    }
    setLoading(false);
  };



  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (qIndex, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      duration: 30,
      questions: [
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    });
    setShowForm(false);
    setEditingQuiz(null);
    setError('');
    setErrors({});
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject._id,
      duration: quiz.duration,
      questions: quiz.questions
    });
    setShowForm(true);
  };

  const handleDelete = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/quiz/deleteQuizz/${quizId}`);
        fetchQuizzes();
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting quiz:', error);
        setError('Failed to delete quiz');
      }
    }
  };

  // Generate AI description using xAI Grok
  const generateAIDescription = async (subjectName) => {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Write a comprehensive and engaging description about ${subjectName} as an educational subject. Include its importance, key areas of study, practical applications, and why students should be interested in learning about it. Make it informative yet accessible, around 200-300 words.`
            }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI description:', error);
      return `${subjectName} is a fascinating field of study that offers students the opportunity to explore fundamental concepts and develop critical thinking skills. This subject provides valuable knowledge and practical applications that are essential in today's world.`;
    }
  };

  // SIMPLIFIED: Always use physics prompt for all subjects to test image generation
  const getCreativePrompt = (subjectName) => {
    console.log(`Generating physics prompt for subject: ${subjectName}`);
    return `Create a colorful physics education poster with: an apple falling from a tree, the equation E=mc² written on a blackboard, lightning bolts and electrical coils, atomic structure with electrons orbiting nucleus, wave patterns, a pendulum, planets and stars in the background. Use bright blue, purple, and gold colors. Make it look like a modern educational poster for physics students.`;
  };

  // Generate image using Gemini 2.5 Flash Image Preview
  const generateSubjectImage = async (subjectName) => {
    try {
      // Try to generate actual image using Gemini 2.5 Flash Image Preview
      console.log(`Attempting to generate image for subject: ${subjectName}`);
      
      const creativePrompt = getCreativePrompt(subjectName);
      console.log(`Using creative prompt: ${creativePrompt}`);
      
      const geminiImageResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=AIzaSyDIPmiAqX4I_0SBdC3-xrpu6QMvuRbAJ-Y`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: creativePrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      console.log(`Gemini Image API Response Status: ${geminiImageResponse.status}`);

      if (geminiImageResponse.ok) {
        const geminiImageData = await geminiImageResponse.json();
        console.log('Gemini Image API Response:', geminiImageData);
        
        // Check if we got an image in the response
        const candidate = geminiImageData.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              console.log('Found generated image data!');
              // Convert base64 to blob URL
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';
              
              try {
                const binaryString = atob(imageData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: mimeType });
                const imageUrl = URL.createObjectURL(blob);
                
                return {
                  url: imageUrl,
                  description: `AI-generated physics education illustration created with Gemini 2.5 Flash`,
                  alt: `AI-generated physics education illustration`,
                  isGenerated: true
                };
              } catch (base64Error) {
                console.error('Error processing base64 image data:', base64Error);
              }
            }
          }
        }
      } else {
        const errorData = await geminiImageResponse.text();
        console.error('Gemini Image API Error:', errorData);
      }

      // Fallback: Use Gemini text generation for description with a better placeholder
      console.log('Falling back to text description generation...');
      const geminiTextResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDIPmiAqX4I_0SBdC3-xrpu6QMvuRbAJ-Y`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Describe in detail what a physics education poster should look like with apples, E=mc², lightning bolts, atoms, waves, pendulums, planets and stars.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      let imageDescription = `Physics education poster with apples, E=mc², lightning, atoms, waves, pendulum, planets and stars`;
      if (geminiTextResponse.ok) {
        const geminiTextData = await geminiTextResponse.json();
        imageDescription = geminiTextData.candidates[0]?.content?.parts[0]?.text || imageDescription;
      }

      // Use a physics-themed placeholder
      const placeholderUrl = `https://via.placeholder.com/400x300/4169E1/white?text=Physics+E%3Dmc²`;
      
      return {
        url: placeholderUrl,
        description: imageDescription,
        alt: `Physics education illustration`,
        isGenerated: false
      };
      
    } catch (error) {
      console.error('Error generating subject image:', error);
      
      // Fallback: Create a physics-themed placeholder
      return {
        url: `https://via.placeholder.com/400x300/4169E1/white?text=Physics+E%3Dmc²`,
        description: `Physics education poster with apple, E=mc², lightning bolts, atomic structure, waves, pendulum, planets and stars`,
        alt: `Physics education illustration`,
        isGenerated: false
      };
    }
  };

  // Generate PDF with AI description and image
  const generatePDF = async (quiz) => {
    setGeneratingPdf(quiz._id);
    
    try {
      // Generate AI description and image for the subject
      const [aiDescription, subjectImage] = await Promise.all([
        generateAIDescription(quiz.subject?.name || 'General Studies'),
        generateSubjectImage(quiz.subject?.name || 'General Studies')
      ]);
      
      // Create PDF content
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Quiz Report - ${quiz.title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 40px;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #4CAF50; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .title { 
              color: #2c3e50; 
              font-size: 28px; 
              margin-bottom: 10px;
            }
            .subtitle { 
              color: #7f8c8d; 
              font-size: 16px;
            }
            .section { 
              margin: 25px 0; 
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .section-title { 
              color: #2c3e50; 
              font-size: 20px; 
              margin-bottom: 15px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 5px;
            }
            .quiz-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin: 20px 0;
            }
            .info-item { 
              background: white; 
              padding: 15px; 
              border-radius: 5px;
              border-left: 4px solid #3498db;
            }
            .info-label { 
              font-weight: bold; 
              color: #2c3e50;
            }
            .description { 
              text-align: justify; 
              line-height: 1.8;
              background: white;
              padding: 20px;
              border-radius: 5px;
              border-left: 4px solid #4CAF50;
            }
            .subject-image {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background: white;
              border-radius: 5px;
              border-left: 4px solid #9b59b6;
            }
            .subject-image img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .image-description {
              margin-top: 15px;
              font-style: italic;
              color: #666;
              font-size: 14px;
            }
            .questions-list {
              background: white;
              padding: 20px;
              border-radius: 5px;
            }
            .question-item {
              margin: 15px 0;
              padding: 15px;
              background: #f1f2f6;
              border-radius: 5px;
              border-left: 3px solid #e74c3c;
            }
            .question-text {
              font-weight: bold;
              margin-bottom: 10px;
              color: #2c3e50;
            }
            .options {
              margin-left: 20px;
            }
            .option {
              margin: 5px 0;
              padding: 5px;
            }
            .correct-answer {
              background-color: #d4edda;
              color: #155724;
              font-weight: bold;
              border-radius: 3px;
              padding: 3px 8px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${quiz.title}</h1>
            <p class="subtitle">Quiz Report & Subject Overview</p>
          </div>

          <div class="section">
            <h2 class="section-title">Quiz Information</h2>
            <div class="quiz-info">
              <div class="info-item">
                <div class="info-label">Subject:</div>
                <div>${quiz.subject?.name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Duration:</div>
                <div>${quiz.duration} minutes</div>
              </div>
              <div class="info-item">
                <div class="info-label">Questions:</div>
                <div>${quiz.questions?.length || 0} questions</div>
              </div>
              <div class="info-item">
                <div class="info-label">Created By:</div>
                <div>${quiz.createdBy?.username || 'Unknown'}</div>
              </div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1; margin-top: 15px;">
              <div class="info-label">Description:</div>
              <div>${quiz.description}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">About ${quiz.subject?.name || 'This Subject'}</h2>
            <div class="description">
              ${aiDescription}
            </div>
            <div class="subject-image">
              <img src="${subjectImage.url}" alt="${subjectImage.alt}" />
              <div class="image-description">
                ${subjectImage.description}
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Quiz Questions</h2>
            <div class="questions-list">
              ${quiz.questions?.map((question, index) => `
                <div class="question-item">
                  <div class="question-text">Question ${index + 1}: ${question.question}</div>
                  <div class="options">
                    ${question.options?.map((option, optIndex) => `
                      <div class="option">
                        ${optIndex === question.correctAnswer ? 
                          `<span class="correct-answer">✓ ${option} (Correct Answer)</span>` : 
                          `• ${option}`
                        }
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Powered by AI-Generated Content (Testing Physics Theme)</p>
          </div>
        </body>
        </html>
      `;

      // Create and download PDF
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-report-${quiz.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      alert('PDF report generated successfully! The file has been downloaded.');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h3 className="section-title">Quizzes Management</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSubjectsModal(true)}
          >
            Manage Subjects
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add Quiz
          </button>
        </div>
      </div>

      {showSubjectsModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Subjects Management</h3>
              <button className="close-btn" onClick={() => setShowSubjectsModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <SubjectManager onUpdate={fetchSubjects} />
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingQuiz ? 'Edit Quiz' : 'Add New Quiz'}
              </h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Quiz Title:</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    checkField('title', e.target.value);
                  }}
                  required
                />
                {errors.title && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.title}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    checkField('description', e.target.value);
                  }}
                  required
                />
                {errors.description && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.description}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject:</label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    checkField('subject', e.target.value);
                  }}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.subject}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes):</label>
                <input
                  type="number"
                  id="duration"
                  min="1"
                  value={formData.duration}
                  onChi ange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({ ...formData, duration: value });
                    checkField('duration', value);
                  }}
                  required
                />
                {errors.duration && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.duration}
                  </div>
                )}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Questions:</label>
                  <button type="button" className="btn btn-small btn-success" onClick={addQuestion}>
                    Add Question
                  </button>
                </div>
                
                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="question-form" style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>Question {qIndex + 1}</strong>
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Enter question"
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        required
                      />
                      {!question.question && (
                        <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                          La question est requise
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Options:</label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                            style={{ marginRight: '10px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              placeholder={`Option ${oIndex + 1}`}
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              required
                              style={{ width: '100%' }}
                            />
                            {!option && (
                              <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>
                                L'option {oIndex + 1} est requise
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingQuiz ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Duration</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz._id}>
                <td>{quiz.title}</td>
                <td>{quiz.subject?.name}</td>
                <td>{quiz.questions?.length || 0}</td>
                <td>{quiz.duration} min</td>
                <td>{quiz.createdBy?.username}</td>
                <td>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => handleEdit(quiz)}
                    style={{ marginRight: '5px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-success"
                    onClick={() => generatePDF(quiz)}
                    disabled={generatingPdf === quiz._id}
                    style={{ marginRight: '5px' }}
                  >
                    {generatingPdf === quiz._id ? 'Generating...' : '📄 AI PDF'}
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(quiz._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {quizzes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No quizzes found. Create your first quiz!
          </div>
        )}
      </div>
    </div>
  );
}
export default QuizManager;