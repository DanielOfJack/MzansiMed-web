import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { medicationsApi, Medication, ApiError } from '../services/api';
import './LoadPreviousMedicationsPage.css';

interface MedicationSelection {
  [medicationId: string]: boolean;
}

const LoadPreviousMedicationsPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<MedicationSelection>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    // Get patient data from localStorage or location state
    const storedPatientData = localStorage.getItem('patientData');
    let currentPatientData = null;

    if (location.state?.patient) {
      currentPatientData = location.state.patient;
    } else if (storedPatientData) {
      try {
        currentPatientData = JSON.parse(storedPatientData);
      } catch (error) {
        console.error('Error parsing patient data:', error);
      }
    }

    if (!currentPatientData || !currentPatientData.id) {
      setError('No patient selected. Please go back and select a patient.');
      setLoading(false);
      return;
    }

    setPatientData(currentPatientData);
    fetchPatientMedications(currentPatientData.id);
  }, [location.state]);

  const fetchPatientMedications = async (patientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await medicationsApi.getMedications({
        patientId: patientId,
        limit: 100 // Get all medications for this patient
      });

      setMedications(response.data);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationSelect = (medicationId: string, isSelected: boolean) => {
    setSelectedMedications(prev => ({
      ...prev,
      [medicationId]: isSelected
    }));
  };

  const handleSelectAll = () => {
    const allSelected = medications.every(med => selectedMedications[med.id]);
    const newSelections: MedicationSelection = {};
    
    medications.forEach(med => {
      newSelections[med.id] = !allSelected;
    });
    
    setSelectedMedications(newSelections);
  };

  const handleLoadSelected = () => {
    const selectedMedicationsList = medications.filter(med => selectedMedications[med.id]);
    
    if (selectedMedicationsList.length === 0) {
      setError('Please select at least one medication to load.');
      return;
    }

    // Convert selected medications to the format expected by AddMedicationPage
    const medicationTabs = selectedMedicationsList.map((medication, index) => ({
      id: index + 1,
      name: medication.name,
      isActive: index === 0, // Make first medication active
      formData: {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        interval: medication.interval || '',
        timeOfDay: medication.timeOfDay || '',
        precautions: medication.precautions || []
      },
      instructions: {
        english: medication.englishInstructions || '',
        translated: medication.translatedInstructions || 'This will have the translated instructions',
        selectedLanguage: medication.targetLanguage || patientData?.homeLanguage || 'isiZulu'
      }
    }));

    // Save to localStorage for AddMedicationPage to pick up
    localStorage.setItem('medicationTabs', JSON.stringify(medicationTabs));
    
    // Navigate to AddMedicationPage
    navigate('/add-medication');
  };

  const handleBackToPatient = () => {
    navigate('/manage-patient');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSelectedCount = () => {
    return Object.values(selectedMedications).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="load-medications-page">
        <div className="loading-message">Loading patient medications...</div>
      </div>
    );
  }

  return (
    <div className="load-medications-page">
      {/* Compact Header */}
      <div className="compact-header">
        <div className="header-left">
          <img 
            src="/mzansimed_logo_no_text.png" 
            alt="MzansiMed Logo" 
            className="header-logo"
          />
          <h1 className="brand-name">MzansiMed</h1>
        </div>
        <div className="header-center">
          <p className="user-info">Daniel van Zyl (P-10513)</p>
        </div>
        <div className="header-right">
          <button className="shortcuts-btn">
            <img src="/command-svgrepo-com.svg" alt="Shortcuts" className="shortcuts-icon" />
            Shortcuts
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <img src="/logout-svgrepo-com.svg" alt="Logout" className="logout-icon" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-container">
          <div className="page-header">
            <div className="header-info">
              <h2 className="page-title">Medication History</h2>
              {patientData && (
                <p className="patient-info">
                  Patient: {patientData.initials} {patientData.surname} | 
                  Language: {patientData.homeLanguage}
                </p>
              )}
            </div>
            <div className="header-actions">
              <button className="btn btn-patient" onClick={handleBackToPatient}>
                Back to Patient
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {medications.length === 0 && !error ? (
            <div className="no-medications-message">
              <h3>No Previous Medications Found</h3>
              <p>This patient has no previous medication history in the system.</p>
              <button className="btn btn-add-medication" onClick={() => navigate('/add-medication')}>
                Add New Medication
              </button>
            </div>
          ) : (
            <>
              <div className="medications-controls">
                <div className="control-group">
                  <button 
                    className="btn btn-patient" 
                    onClick={handleSelectAll}
                  >
                    {medications.every(med => selectedMedications[med.id]) ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selection-count">
                    {getSelectedCount()} of {medications.length} selected
                  </span>
                </div>
                
                <button 
                  className="btn btn-primary"
                  onClick={handleLoadSelected}
                  disabled={getSelectedCount() === 0}
                >
                  Load Selected Medications ({getSelectedCount()})
                </button>
              </div>

              <div className="medications-table-container">
                <table className="medications-table">
                  <thead>
                    <tr>
                      <th className="select-column">
                        <input
                          type="checkbox"
                          checked={medications.length > 0 && medications.every(med => selectedMedications[med.id])}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Interval</th>
                      <th>Time of Day</th>
                      <th>Prescribed Date</th>
                      <th>Precautions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((medication) => (
                      <tr 
                        key={medication.id}
                        className={selectedMedications[medication.id] ? 'selected' : ''}
                      >
                        <td className="select-column">
                          <input
                            type="checkbox"
                            checked={selectedMedications[medication.id] || false}
                            onChange={(e) => handleMedicationSelect(medication.id, e.target.checked)}
                          />
                        </td>
                        <td className="medication-name">
                          <strong>{medication.name}</strong>
                        </td>
                        <td>{medication.dosage}</td>
                        <td>{medication.frequency}</td>
                        <td>{medication.interval || '-'}</td>
                        <td>{medication.timeOfDay || '-'}</td>
                        <td>{formatDate(medication.prescribedDate)}</td>
                        <td className="precautions-cell">
                          {medication.precautions.length > 0 ? (
                            <div className="precautions-list">
                              {medication.precautions.slice(0, 2).map((precaution, index) => (
                                <span key={index} className="precaution-item">
                                  {precaution}
                                </span>
                              ))}
                              {medication.precautions.length > 2 && (
                                <span className="precaution-more">
                                  +{medication.precautions.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {getSelectedCount() > 0 && (
                <div className="selected-medications-summary">
                  <h3>Selected Medications Summary</h3>
                  <div className="summary-list">
                    {medications
                      .filter(med => selectedMedications[med.id])
                      .map((medication) => (
                        <div key={medication.id} className="summary-item">
                          <strong>{medication.name}</strong> - {medication.dosage} {medication.frequency.toLowerCase()}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadPreviousMedicationsPage;
