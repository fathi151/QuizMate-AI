import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">
          🎓
        </div>
        <span>EduQuiz Pro</span>
      </Link>
      
      {user && (
        <div className="navbar-menu">
          <div className="navbar-links">
            <Link to="/dashboard" className="nav-link">
              📊 Dashboard
            </Link>
            <Link to="/audio" className="nav-link">
              🎵 Audio Manager
            </Link>
          </div>
          <div className="navbar-user">
            <div className="user-info">
              <span className="username">👋 {user.username}</span>
              <span className="user-role">
                {user.role === 'teacher' ? '👨‍🏫 Enseignant' : '👨‍🎓 Étudiant'}
              </span>
            </div>
            <button onClick={onLogout} className="logout-btn">
              <span>🚪</span>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;