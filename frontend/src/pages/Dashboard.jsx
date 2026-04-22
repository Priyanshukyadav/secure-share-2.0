import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import UserProfile from '../components/UserProfile';
import { authAPI, setAuthToken } from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔐 Encrypted File Sharing</h1>
          <UserProfile user={user} onLogout={handleLogout} />
        </div>
      </header>

      <main className="dashboard-main">
        <section className="upload-section">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </section>

        <section className="files-section">
          <FileList key={refreshKey} />
        </section>
      </main>
    </div>
  );
}
