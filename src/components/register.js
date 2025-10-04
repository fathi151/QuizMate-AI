import React, { useState } from "react";
import { Link } from 'react-router-dom';
import axios from 'axios';

const Register = ({ onLogin }) => {
  const [Formulaire, setFormulaire] = useState({
    username: '',
    email: '',
    password: '',
    confirmedPassword: '',
    role: 'student'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [Loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormulaire({
      ...Formulaire,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Formulaire.password !== Formulaire.confirmedPassword) {
      setError('❌ Les mots de passe ne correspondent pas');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: Formulaire.username,
        email: Formulaire.email,
        password: Formulaire.password,
        role: Formulaire.role
      });

      onLogin(response.data.user);

      // ✅ Message de succès
      setSuccess('✅ Inscription réussie ! Vous êtes connecté.');
    } catch (err) {
      setError(err.response?.data?.message || '❌ Échec de l\'inscription');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="education-icon">📚</div>
        <h2>Rejoindre EduQuiz Pro</h2>
        <p>Créez votre compte pour commencer à apprendre</p>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            {success}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">👤 Nom d'utilisateur</label>
          <input
            type="text"
            id="username"
            name="username"
            value={Formulaire.username}
            onChange={handleChange}
            placeholder="Choisissez un nom d'utilisateur"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">📧 Adresse Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={Formulaire.email}
            onChange={handleChange}
            placeholder="votre.email@exemple.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">🎯 Votre Rôle</label>
          <select
            id="role"
            name="role"
            value={Formulaire.role}
            onChange={handleChange}
          >
            <option value="student">👨‍🎓 Étudiant</option>
            <option value="admin">👨‍🏫 Enseignant/Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="password">🔒 Mot de Passe</label>
          <input
            type="password"
            id="password"
            name="password"
            value={Formulaire.password}
            onChange={handleChange}
            placeholder="Minimum 6 caractères"
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmedPassword">🔐 Confirmer le Mot de Passe</label>
          <input
            type="password"
            id="confirmedPassword"
            name="confirmedPassword"
            value={Formulaire.confirmedPassword}
            onChange={handleChange}
            placeholder="Répétez votre mot de passe"
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={Loading}>
          {Loading ? (
            <>
              <div className="loading-spinner" style={{width: '16px', height: '16px'}}></div>
              Création du compte...
            </>
          ) : (
            <>
              🚀 Créer mon Compte
            </>
          )}
        </button>

        <div className="auth-switch">
          Déjà un compte ? <Link to="/login">🔑 Se connecter</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
