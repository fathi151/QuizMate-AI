import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import Login from './components/login';
import Register from './components/register';
import QuizManager from './components/QuizMangement';
import AudioManager from './components/AudioManager';
import Navbar from './components/navbar';
import StudentDashboard from './components/StudentDashboard';

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
   
  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // You can add token validation here if needed
          // For now, we'll just set loading to false
        }
      } catch (error) {
        console.log('No valid session found');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Chargement d'EduQuiz Pro...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route 
              path="/login" 
              element={
                user ? 
                  <Navigate to={user.role==='admin'?'/dashboard': '/Student'} /> : 
                  <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? 
                  <Navigate to="/dashboard" /> : 
                  <Register onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user && user.role=='admin' ? 
                  <QuizManager user={user}  /> : 
                  <Navigate to="/login" />
              } 
            />
                <Route 
              path="/student" 
              element={
                user ? 
                  <StudentDashboard user={user}  /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/QuizManager" 
              element={<Navigate to="/dashboard" />}
            />
            <Route 
              path="/audio" 
              element={
                user ? 
                  <AudioManager user={user} /> : 
                  <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
