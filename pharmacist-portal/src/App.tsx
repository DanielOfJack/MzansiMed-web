import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagePatientPage from './pages/ManagePatientPage';
import LoadPreviousMedicationsPage from './pages/LoadPreviousMedicationsPage';
import AddMedicationPage from './pages/AddMedicationPage';
import CheckInstructionsPage from './pages/CheckInstructionsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { preloadTranslations } from './utils/backendTranslationUtils';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  // Preload translations when app starts
  useEffect(() => {
    preloadTranslations();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/manage-patient" 
          element={
            <ProtectedRoute>
              <ManagePatientPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/load-previous-medications" 
          element={
            <ProtectedRoute>
              <LoadPreviousMedicationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-medication" 
          element={
            <ProtectedRoute>
              <AddMedicationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/check-instructions" 
          element={
            <ProtectedRoute>
              <CheckInstructionsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/manage-patient" replace />} />
      </Routes>
    </Router>
  );
};

// App Component with Auth Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
