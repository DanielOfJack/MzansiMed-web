import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientsApi, Patient, PatientFormData, ApiError } from '../services/api';
import './ManagePatientPage.css';

interface PatientForm {
  initials: string;
  surname: string;
  address: string;
  cellNumber: string;
  homeLanguage: string;
}

const ManagePatientPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [patientForm, setPatientForm] = useState<PatientForm>({
    initials: '',
    surname: '',
    address: '',
    cellNumber: '',
    homeLanguage: ''
  });

  const [existingPatients, setExistingPatients] = useState<Patient[]>([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  // Language options
  const languageOptions = ['Afrikaans', 'isiXhosa', 'isiZulu'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInputChange = (field: keyof PatientForm, value: string) => {
    setPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(prev => !prev);
  };

  const selectLanguage = (language: string) => {
    handleInputChange('homeLanguage', language);
    setShowLanguageDropdown(false);
  };

  const clearLanguage = () => {
    handleInputChange('homeLanguage', '');
  };

  // Fetch patients from API with debounced search
  const fetchPatients = useCallback(async () => {
    const hasAnyInput = patientForm.initials || patientForm.surname || patientForm.address || patientForm.cellNumber || patientForm.homeLanguage;
    
    if (!hasAnyInput) {
      setExistingPatients([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await patientsApi.getPatients({
        initials: patientForm.initials || undefined,
        surname: patientForm.surname || undefined,
        address: patientForm.address || undefined,
        cellNumber: patientForm.cellNumber || undefined,
        homeLanguage: patientForm.homeLanguage || undefined,
        limit: 20
      });

      setExistingPatients(response.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to fetch patients');
      setExistingPatients([]);
    } finally {
      setLoading(false);
    }
  }, [patientForm]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchPatients]);

  const handleContinue = async () => {
    if (!isFormValid()) return;

    setIsCreatingPatient(true);
    setError(null);

    try {
      // Check if this is an existing patient or create a new one
      const existingPatient = existingPatients.find(patient => 
        patient.initials === patientForm.initials &&
        patient.surname === patientForm.surname &&
        patient.cellNumber === patientForm.cellNumber
      );

      let patientData;
      
      if (existingPatient) {
        // Use existing patient
        patientData = existingPatient;
      } else {
        // Create new patient
        const response = await patientsApi.createPatient(patientForm as PatientFormData);
        patientData = response.data;
      }

      // Save patient data to localStorage for use in other pages
      localStorage.setItem('patientData', JSON.stringify(patientData));
      navigate('/add-medication');
    } catch (err) {
      console.error('Error handling patient:', err);
      if (err instanceof ApiError && err.status === 409) {
        // Patient already exists - this shouldn't happen with our logic, but handle it gracefully
        setError('A patient with these details already exists. Please check the filtered results below.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to save patient data');
      }
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const handleLoadPreviousMedications = async () => {
    if (!isFormValid()) return;

    setIsCreatingPatient(true);
    setError(null);

    try {
      // Check if this is an existing patient or create a new one
      const existingPatient = existingPatients.find(patient => 
        patient.initials === patientForm.initials &&
        patient.surname === patientForm.surname &&
        patient.cellNumber === patientForm.cellNumber
      );

      let patientData;
      
      if (existingPatient) {
        // Use existing patient
        patientData = existingPatient;
      } else {
        // Create new patient
        const response = await patientsApi.createPatient(patientForm as PatientFormData);
        patientData = response.data;
      }

      // Save patient data to localStorage for use in other pages
      localStorage.setItem('patientData', JSON.stringify(patientData));
      
      // Navigate to Load Previous Medications page
      navigate('/load-previous-medications', { 
        state: { patient: patientData } 
      });
    } catch (err) {
      console.error('Error handling patient:', err);
      if (err instanceof ApiError && err.status === 409) {
        // Patient already exists - this shouldn't happen with our logic, but handle it gracefully
        setError('A patient with these details already exists. Please check the filtered results below.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to save patient data');
      }
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // The filtered patients are now coming from the API search
  const filteredPatients = existingPatients;

  const isFormValid = () => {
    return patientForm.initials.trim() !== '' && 
           patientForm.surname.trim() !== '' && 
           patientForm.address.trim() !== '' && 
           patientForm.cellNumber.trim() !== '' && 
           patientForm.homeLanguage.trim() !== '';
  };

  return (
    <div className="manage-patient-page">
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
        <div className="left-panel">
          <div className="form-panel">
            <div className="panel-header">
              <h2 className="panel-title">Patient Information</h2>
            </div>
            
            <form className="patient-form">
              <div className="form-section">
                <h3>Patient Details</h3>
                
                <div className="form-group">
                  <label className="form-label">Initials</label>
                  <input
                    type="text"
                    className="form-input"
                    value={patientForm.initials}
                    onChange={(e) => handleInputChange('initials', e.target.value)}
                    placeholder="e.g., J.D."
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Surname</label>
                  <input
                    type="text"
                    className="form-input"
                    value={patientForm.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    placeholder="Enter surname"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-input address-textarea"
                    value={patientForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cell Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={patientForm.cellNumber}
                    onChange={(e) => handleInputChange('cellNumber', e.target.value)}
                    placeholder="e.g., 082 123 4567"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Translation Language</h3>
                <p className="section-note">This is the language that will be translated to</p>
                
                <div className="form-group">
                  <label className="form-label">Home Language</label>
                  <div className="dropdown-container">
                    <div className="input-with-clear">
                      <input
                        type="text"
                        className="form-input"
                        value={patientForm.homeLanguage}
                        onChange={(e) => handleInputChange('homeLanguage', e.target.value)}
                        onClick={toggleLanguageDropdown}
                        placeholder="Select or type language"
                        autoComplete="off"
                      />
                      {patientForm.homeLanguage && (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={clearLanguage}
                          title="Clear selection"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showLanguageDropdown && (
                      <div className="dropdown-list">
                        {languageOptions
                          .filter(lang => lang.toLowerCase().includes(patientForm.homeLanguage.toLowerCase()))
                          .map((lang, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() => selectLanguage(lang)}
                            >
                              {lang}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-message" style={{ 
                  color: '#dc3545', 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb', 
                  borderRadius: '4px', 
                  padding: '10px', 
                  marginBottom: '15px' 
                }}>
                  {error}
                </div>
              )}

              <div className="form-actions">
                {/* Show Load Previous Medications button only if we have an existing patient match */}
                {existingPatients.some(patient => 
                  patient.initials === patientForm.initials &&
                  patient.surname === patientForm.surname &&
                  patient.cellNumber === patientForm.cellNumber
                ) && (
                  <button
                    type="button"
                    className={`load-previous-btn ${isFormValid() && !isCreatingPatient ? 'enabled' : 'disabled'}`}
                    onClick={handleLoadPreviousMedications}
                    disabled={!isFormValid() || isCreatingPatient}
                  >
                    {isCreatingPatient ? 'Processing...' : 'Load Previous Medications'}
                  </button>
                )}
                
                <button
                  type="button"
                  className={`continue-btn ${isFormValid() && !isCreatingPatient ? 'enabled' : 'disabled'}`}
                  onClick={handleContinue}
                  disabled={!isFormValid() || isCreatingPatient}
                >
                  {isCreatingPatient ? 'Processing...' : 'Add New Medications'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="right-panel">
          <div className="patients-table-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                {loading 
                  ? 'Searching Patients...'
                  : filteredPatients.length === 0 && (patientForm.initials || patientForm.surname || patientForm.address || patientForm.cellNumber || patientForm.homeLanguage) 
                    ? 'No Matching Patients' 
                    : filteredPatients.length > 0 
                      ? `Filtered Patients (${filteredPatients.length})` 
                      : 'Filter Existing Patients'
                }
              </h2>
            </div>

            <div className="patients-table-container">
              {loading ? (
                <div className="no-patients-message">
                  Loading patients...
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="no-patients-message">
                  {!(patientForm.initials || patientForm.surname || patientForm.address || patientForm.cellNumber || patientForm.homeLanguage) 
                    ? 'Start typing in the patient information fields to search existing patients.'
                    : error 
                      ? 'Error loading patients. Please try again.'
                      : 'No patients match the current search criteria.'
                  }
                </div>
              ) : (
                <div className="patients-table">
                  <div className="table-header">
                    <div className="table-cell">Initials</div>
                    <div className="table-cell">Surname</div>
                    <div className="table-cell">Address</div>
                    <div className="table-cell">Cell Number</div>
                  </div>
                  {filteredPatients.map(patient => (
                    <div key={patient.id} className="table-row" onClick={() => {
                      setPatientForm(patient);
                      setShowLanguageDropdown(false);
                    }}>
                      <div className="table-cell">{patient.initials}</div>
                      <div className="table-cell">{patient.surname}</div>
                      <div className="table-cell">{patient.address}</div>
                      <div className="table-cell">{patient.cellNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePatientPage;
