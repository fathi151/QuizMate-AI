import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdvancedDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalSubjects: 0,
    totalQuestions: 0,
    averageDuration: 0,
    recentActivity: []
  });
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [quizzesRes, subjectsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/quiz/getQuizz'),
        axios.get('http://localhost:5000/api/subject/Subjects')
      ]);

      const quizzesData = quizzesRes.data;
      const subjectsData = subjectsRes.data;

      setQuizzes(quizzesData);
      setSubjects(subjectsData);

      // Calculate statistics
      const totalQuestions = quizzesData.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0);
      const avgDuration = quizzesData.length > 0 
        ? Math.round(quizzesData.reduce((sum, quiz) => sum + quiz.duration, 0) / quizzesData.length)
        : 0;

      setStats({
        totalQuizzes: quizzesData.length,
        totalSubjects: subjectsData.length,
        totalQuestions: totalQuestions,
        averageDuration: avgDuration,
        recentActivity: quizzesData.slice(0, 5)
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
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
    if (filterSubject) {
      filtered = filtered.filter(quiz => quiz.subject?._id === filterSubject);
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
        filtered.sort((a, b) => b.duration - a.duration);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredQuizzes = getFilteredQuizzes();

  // Get subject statistics
  const getSubjectStats = () => {
    return subjects.map(subject => {
      const subjectQuizzes = quizzes.filter(q => q.subject?._id === subject._id);
      return {
        ...subject,
        quizCount: subjectQuizzes.length,
        totalQuestions: subjectQuizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)
      };
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="advanced-dashboard">
      {/* Hero Section with Gradient */}
      <div className="dashboard-hero-advanced">
        <div className="hero-content">
          <div className="hero-greeting">
            <h1>👋 Bonjour, {user?.username || 'Utilisateur'} !</h1>
            <p className="hero-subtitle">
              {user?.role === 'admin' 
                ? 'Gérez votre plateforme éducative avec des outils avancés' 
                : 'Continuez votre parcours d\'apprentissage'}
            </p>
          </div>
          <div className="hero-date">
            <div className="date-display">
              <span className="date-icon">📅</span>
              <span>{new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="stats-grid-advanced">
        <div className="stat-card-advanced stat-primary">
          <div className="stat-icon-wrapper">
            <span className="stat-icon-large">📚</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalQuizzes}</div>
            <div className="stat-label">Quiz Disponibles</div>
            <div className="stat-trend">
              <span className="trend-up">↑ +12%</span>
              <span className="trend-text">ce mois</span>
            </div>
          </div>
        </div>

        <div className="stat-card-advanced stat-success">
          <div className="stat-icon-wrapper">
            <span className="stat-icon-large">🎯</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSubjects}</div>
            <div className="stat-label">Matières Actives</div>
            <div className="stat-trend">
              <span className="trend-up">↑ +3</span>
              <span className="trend-text">nouvelles</span>
            </div>
          </div>
        </div>

        <div className="stat-card-advanced stat-warning">
          <div className="stat-icon-wrapper">
            <span className="stat-icon-large">❓</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalQuestions}</div>
            <div className="stat-label">Questions Totales</div>
            <div className="stat-trend">
              <span className="trend-up">↑ +45</span>
              <span className="trend-text">cette semaine</span>
            </div>
          </div>
        </div>

        <div className="stat-card-advanced stat-info">
          <div className="stat-icon-wrapper">
            <span className="stat-icon-large">⏱️</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageDuration}</div>
            <div className="stat-label">Durée Moyenne (min)</div>
            <div className="stat-trend">
              <span className="trend-neutral">→</span>
              <span className="trend-text">stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="section-advanced">
        <div className="filter-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les matières</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="recent">Plus récents</option>
              <option value="title">Titre (A-Z)</option>
              <option value="questions">Nombre de questions</option>
              <option value="duration">Durée</option>
            </select>

            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vue grille"
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          <span className="results-count">
            {filteredQuizzes.length} quiz{filteredQuizzes.length > 1 ? 'zes' : ''} trouvé{filteredQuizzes.length > 1 ? 's' : ''}
          </span>
          {(searchTerm || filterSubject) && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilterSubject('');
              }}
            >
              ✕ Effacer les filtres
            </button>
          )}
        </div>

        {/* Quizzes Display */}
        <div className={viewMode === 'grid' ? 'quizzes-grid-advanced' : 'quizzes-list-advanced'}>
          {filteredQuizzes.map((quiz) => (
            <div key={quiz._id} className={`quiz-card-advanced ${viewMode}`}>
              <div className="quiz-card-header">
                <div className="quiz-badge">
                  {quiz.subject?.name || 'Sans matière'}
                </div>
                <div className="quiz-menu">⋮</div>
              </div>
              
              <div className="quiz-card-body">
                <h3 className="quiz-title">{quiz.title}</h3>
                <p className="quiz-description">{quiz.description}</p>
                
                <div className="quiz-meta">
                  <div className="meta-item">
                    <span className="meta-icon">❓</span>
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{quiz.duration} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👤</span>
                    <span>{quiz.createdBy?.username || 'Anonyme'}</span>
                  </div>
                </div>
              </div>

              <div className="quiz-card-footer">
                <button className="btn-quiz-action btn-primary-action">
                  <span>▶</span>
                  Commencer
                </button>
                <button className="btn-quiz-action btn-secondary-action">
                  <span>👁️</span>
                  Aperçu
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Aucun quiz trouvé</h3>
            <p>Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* Subject Statistics Section */}
      <div className="section-advanced">
        <div className="section-header-advanced">
          <h2 className="section-title-advanced">
            <span className="title-icon">📊</span>
            Statistiques par Matière
          </h2>
        </div>

        <div className="subjects-stats-grid">
          {getSubjectStats().map((subject) => (
            <div key={subject._id} className="subject-stat-card">
              <div className="subject-stat-header">
                <div className="subject-icon-circle">
                  {subject.name.charAt(0).toUpperCase()}
                </div>
                <div className="subject-info">
                  <h4 className="subject-name">{subject.name}</h4>
                  <p className="subject-desc">{subject.description}</p>
                </div>
              </div>
              
              <div className="subject-stat-body">
                <div className="stat-row">
                  <span className="stat-label-small">Quiz</span>
                  <span className="stat-value-small">{subject.quizCount}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label-small">Questions</span>
                  <span className="stat-value-small">{subject.totalQuestions}</span>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min((subject.quizCount / stats.totalQuizzes) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="progress-label">
                  {Math.round((subject.quizCount / stats.totalQuizzes) * 100)}% du total
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="section-advanced">
        <div className="section-header-advanced">
          <h2 className="section-title-advanced">
            <span className="title-icon">🕐</span>
            Activité Récente
          </h2>
        </div>

        <div className="activity-timeline">
          {stats.recentActivity.map((quiz, index) => (
            <div key={quiz._id} className="activity-item">
              <div className="activity-marker"></div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-title">{quiz.title}</span>
                  <span className="activity-time">
                    {new Date(quiz.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="activity-details">
                  <span className="activity-badge">{quiz.subject?.name}</span>
                  <span className="activity-meta">
                    {quiz.questions?.length} questions • {quiz.duration} min
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
