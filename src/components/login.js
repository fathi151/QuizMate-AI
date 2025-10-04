import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page-container">
      {/* Left Side - Image Section */}
      <div className="login-image-section">
        <div className="login-image-overlay">
          <div className="login-brand">
            <div className="brand-icon">🎓</div>
            <h1>EduQuiz Pro</h1>
            <p>Votre plateforme d'apprentissage intelligente</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>Quiz interactifs personnalisés</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span>Gestion de matières simplifiée</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Suivi de progression en temps réel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Bienvenue</h2>
            <p>Connectez-vous à votre compte</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert alert-error">
                <div className="alert-icon">⚠️</div>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Adresse Email</label>
              <div className="input-wrapper">
                <span className="input-icon">���</span>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="votre.email@exemple.com"
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de Passe</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Entrez votre mot de passe"
                  required 
                />
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
              <a href="#" className="forgot-password">Mot de passe oublié ?</a>
            </div>

            <button type="submit" className="btn btn-login" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner" style={{width: '16px', height: '16px'}}></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se Connecter
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>ou</span>
            </div>

            <div className="auth-switch">
              Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
