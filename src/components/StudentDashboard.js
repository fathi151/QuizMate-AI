import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = ({ user }) => {
  const [subjects, SetSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setErrors] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent');
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [showQuickStats, setShowQuickStats] = useState(true);

  useEffect(() => {
    fetchQuizzes();
    loadCompletedQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const [subjectsSet, QuizzesSet] = await Promise.all([
        axios.get('http://localhost:5000/api/subject/Subjects'),
        axios.get('http://localhost:5000/api/quiz/getQuizz')
      ]);
      SetSubjects(subjectsSet.data);
      setQuizzes(QuizzesSet.data);
    } catch (error) {
      console.log("erreur Fetching Data personnelllll:", error);
      setErrors('Failed To Load Data');
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedQuizzes = () => {
    const completed = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
    setCompletedQuizzes(completed);
  };

  // Filter and sort quizzes
  const getFilteredQuizzes = () => {
    let filtered = [...quizzes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Subject filter
    if (selectedSubject) {
      filtered = filtered.filter(quiz => quiz.subject?._id === selectedSubject);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'questions':
        filtered.sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredQuizzes = getFilteredQuizzes();

  const isQuizCompleted = (quizId) => {
    return completedQuizzes.includes(quizId);
  };

  const getProgressPercentage = () => {
    if (quizzes.length === 0) return 0;
    return Math.round((completedQuizzes.length / quizzes.length) * 100);
  };

  const getDifficultyColor = (questionsCount) => {
    if (questionsCount <= 5) return 'easy';
    if (questionsCount <= 10) return 'medium';
    return 'hard';
  };

  const getDifficultyLabel = (questionsCount) => {
    if (questionsCount <= 5) return 'Facile';
    if (questionsCount <= 10) return 'Moyen';
    return 'Difficile';
  };






  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Chargement de votre tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-modern">
      {/* Hero Section with Welcome Message */}
      <div className="student-hero">
        <div className="hero-content-student">
          <div className="welcome-section">
            <h1 className="hero-title-student">
              👋 Bonjour, <span className="username-highlight">{user.username}</span> !
            </h1>
            <p className="hero-subtitle-student">
              Prêt à tester vos connaissances aujourd'hui ?
            </p>
          </div>
          <div className="hero-stats-quick">
            <div className="quick-stat">
              <div className="quick-stat-icon">🎯</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{completedQuizzes.length}</div>
                <div className="quick-stat-label">Quiz complétés</div>
              </div>
            </div>
            <div className="quick-stat">
              <div className="quick-stat-icon">📊</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{getProgressPercentage()}%</div>
                <div className="quick-stat-label">Progression</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Enhanced Stats Cards */}
      <div className="student-stats-grid">
        <div className="student-stat-card stat-primary-student">
          <div className="stat-icon-student">📚</div>
          <div className="stat-details">
            <div className="stat-number-student">{quizzes.length}</div>
            <div className="stat-label-student">Quiz Disponibles</div>
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="student-stat-card stat-success-student">
          <div className="stat-icon-student">✅</div>
          <div className="stat-details">
            <div className="stat-number-student">{completedQuizzes.length}</div>
            <div className="stat-label-student">Quiz Terminés</div>
            <div className="stat-badge-success">Excellent travail !</div>
          </div>
        </div>

        <div className="student-stat-card stat-warning-student">
          <div className="stat-icon-student">🎓</div>
          <div className="stat-details">
            <div className="stat-number-student">{subjects.length}</div>
            <div className="stat-label-student">Matières</div>
            <div className="stat-badge-info">Explorez plus</div>
          </div>
        </div>

        <div className="student-stat-card stat-info-student">
          <div className="stat-icon-student">⏱️</div>
          <div className="stat-details">
            <div className="stat-number-student">
              {quizzes.reduce((sum, q) => sum + q.duration, 0)}
            </div>
            <div className="stat-label-student">Minutes de contenu</div>
            <div className="stat-badge-primary">Temps d'étude</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="student-controls">
        <div className="search-filter-section">
          <div className="search-box-student">
            <span className="search-icon-student">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-student"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-controls-student">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="filter-select-student"
            >
              <option value="">📚 Toutes les matières</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select-student"
            >
              <option value="recent">🕐 Plus récents</option>
              <option value="title">🔤 Titre (A-Z)</option>
              <option value="questions">❓ Nombre de questions</option>
              <option value="duration">⏱️ Durée</option>
            </select>

            <div className="view-toggle-student">
              <button
                className={`view-btn-student ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vue grille"
              >
                ⊞
              </button>
              <button
                className={`view-btn-student ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {(searchTerm || selectedSubject) && (
          <div className="active-filters">
            <span className="filter-label">Filtres actifs:</span>
            {searchTerm && (
              <span className="filter-tag">
                🔍 "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>✕</button>
              </span>
            )}
            {selectedSubject && (
              <span className="filter-tag">
                📚 {subjects.find(s => s._id === selectedSubject)?.name}
                <button onClick={() => setSelectedSubject('')}>✕</button>
              </span>
            )}
            <button 
              className="clear-all-filters"
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('');
              }}
            >
              Effacer tout
            </button>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="results-info-student">
        <span className="results-count-student">
          {filteredQuizzes.length} quiz{filteredQuizzes.length > 1 ? 'zes' : ''} trouvé{filteredQuizzes.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Quizzes Grid/List */}
      <div className={viewMode === 'grid' ? 'quizzes-grid-student' : 'quizzes-list-student'}>
        {filteredQuizzes.map((quiz) => (
          <div key={quiz._id} className={`quiz-card-student ${viewMode}`}>
            <div className="quiz-card-header-student">
              <div className="quiz-subject-badge">
                {quiz.subject?.name || 'Sans matière'}
              </div>
              {isQuizCompleted(quiz._id) && (
                <div className="quiz-completed-badge">
                  ✓ Complété
                </div>
              )}
            </div>

            <div className="quiz-card-body-student">
              <h3 className="quiz-title-student">{quiz.title}</h3>
              <p className="quiz-description-student">{quiz.description}</p>

              <div className="quiz-meta-student">
                <div className="meta-item-student">
                  <span className="meta-icon-student">❓</span>
                  <span>{quiz.questions?.length || 0} questions</span>
                </div>
                <div className="meta-item-student">
                  <span className="meta-icon-student">⏱️</span>
                  <span>{quiz.duration} min</span>
                </div>
                <div className={`meta-item-student difficulty-${getDifficultyColor(quiz.questions?.length || 0)}`}>
                  <span className="meta-icon-student">🎯</span>
                  <span>{getDifficultyLabel(quiz.questions?.length || 0)}</span>
                </div>
              </div>
            </div>

            <div className="quiz-card-footer-student">
              <Link
                to={`/quiz/${quiz._id}`}
                className="btn-take-quiz"
              >
                <span>▶</span>
                {isQuizCompleted(quiz._id) ? 'Refaire le quiz' : 'Commencer le quiz'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredQuizzes.length === 0 && (
        <div className="empty-state-student">
          <div className="empty-icon-student">🔍</div>
          <h3>Aucun quiz trouvé</h3>
          <p>
            {searchTerm || selectedSubject
              ? 'Essayez de modifier vos critères de recherche'
              : 'Aucun quiz n\'est disponible pour le moment'}
          </p>
          {(searchTerm || selectedSubject) && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('');
              }}
            >
              Voir tous les quiz
            </button>
          )}
        </div>
      )}

      {/* Subjects Section */}
      {subjects.length > 0 && (
        <div className="subjects-section-student">
          <div className="section-header-student">
            <h2 className="section-title-student">
              <span className="title-icon-student">📖</span>
              Explorez par Matière
            </h2>
          </div>

          <div className="subjects-grid-student">
            {subjects.map((subject) => {
              const subjectQuizzes = quizzes.filter(q => q.subject?._id === subject._id);
              return (
                <div
                  key={subject._id}
                  className="subject-card-student"
                  onClick={() => setSelectedSubject(subject._id)}
                >
                  <div className="subject-icon-student">
                    {subject.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="subject-info-student">
                    <h4 className="subject-name-student">{subject.name}</h4>
                    <p className="subject-desc-student">{subject.description}</p>
                    <div className="subject-stats-student">
                      <span className="subject-quiz-count">
                        {subjectQuizzes.length} quiz{subjectQuizzes.length > 1 ? 'zes' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="subject-arrow">→</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );


}
;
export default StudentDashboard;