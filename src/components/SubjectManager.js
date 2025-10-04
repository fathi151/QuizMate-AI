import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SubjectManager = ({ onUpdate }) => {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subject/Subjects');
      setSubjects(response.data);
    } catch (error) {
      setError('Failed to fetch subjects');
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/subject/ajouterSubject', formData);
      resetForm();
      fetchSubjects(); // Refresh the list
      if (onUpdate) onUpdate();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setError('');
    setShowForm(false);
  };




  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <div className="section-icon">📚</div>
          Gestion des Matières
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <span>➕</span>
          Nouvelle Matière
        </button>
      </div>

      {/* Subject Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {subjects.map((subject) => (
          <div key={subject._id} className="subject-card">
            <div className="subject-icon">
              {subject.name.toLowerCase().includes('math') ? '🔢' :
               subject.name.toLowerCase().includes('science') ? '🔬' :
               subject.name.toLowerCase().includes('history') ? '📜' :
               subject.name.toLowerCase().includes('language') ? '📝' :
               subject.name.toLowerCase().includes('physics') ? '⚡' :
               subject.name.toLowerCase().includes('chemistry') ? '🧪' :
               subject.name.toLowerCase().includes('biology') ? '🧬' :
               subject.name.toLowerCase().includes('geography') ? '🌍' :
               subject.name.toLowerCase().includes('literature') ? '📖' :
               '📚'}
            </div>
            <div className="subject-title">{subject.name}</div>
            <div className="subject-description">{subject.description}</div>
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.8rem', 
              color: 'var(--gray-500)',
              textAlign: 'center'
            }}>
              Créé par: {subject.createdBy?.username || 'Inconnu'}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
          {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                📚 Ajouter une Nouvelle Matière
              </h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">📝 Nom de la Matière</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Mathématiques, Physique, Histoire..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">📄 Description</label>
                  <textarea
                    id="description"
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez brièvement cette matière et ses objectifs d'apprentissage..."
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    <span>❌</span>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{width: '16px', height: '16px'}}></div>
                        Création...
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        Créer la Matière
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
  
  <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject._id}>
                <td>{subject.name}</td>
                <td>{subject.description}</td>
                <td>{subject.createdBy?.username}</td>
                <td>
                  {/* <button
                    className="btn btn-small btn-secondary"
                    onClick={() => handleEdit(subject)}
                    style={{ marginRight: '5px' }}
                  >
                    Edit
                  </button> */}
                  {/* <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(subject._id)}
                  >
                    Delete
                  </button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {subjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No subjects found. Create your first subject!
          </div>
        )}
      </div>
   
    </div>
  );
};

export default SubjectManager;