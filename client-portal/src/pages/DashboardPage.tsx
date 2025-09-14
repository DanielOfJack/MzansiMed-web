import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1 className="page-title">Welcome to MzansiMed Client Portal</h1>
        {user && (
          <div className="user-info">
            <p>Welcome, {user.name}!</p>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        )}
      </div>
      
      <div className="dashboard-content">
        <div className="card">
          <h2>Client Portal Dashboard</h2>
          <p>Welcome to the MzansiMed Client Portal administration panel.</p>
          
          <div className="dashboard-actions" style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/manage-pharmacists')}
            >
              Manage Pharmacists
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
