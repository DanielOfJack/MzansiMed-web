import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pharmacistApi, Pharmacist, PharmacistFormData, ApiError } from '../services/pharmacistApi';
import './ManagePharmacistsPage.css';

interface PharmacistForm {
  name: string;
  surname: string;
  pNumber: string;
  password: string;
}

const ManagePharmacistsPage: React.FC = () => {
  const { logout } = useAuth();

  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [pharmacistForm, setPharmacistForm] = useState<PharmacistForm>({
    name: '',
    surname: '',
    pNumber: '',
    password: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPharmacist, setSelectedPharmacist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPharmacists();
  }, []);

  const fetchPharmacists = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await pharmacistApi.getPharmacists();
      if (response.success && response.data) {
        setPharmacists(response.data);
      } else {
        setError(response.message || 'Failed to fetch pharmacists');
      }
    } catch (err) {
      console.error('Error fetching pharmacists:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to fetch pharmacists');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PharmacistForm, value: string) => {
    setPharmacistForm((prev: PharmacistForm) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreatePharmacist = async () => {
    if (!isFormValid()) {
      setError('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await pharmacistApi.createPharmacist(pharmacistForm as PharmacistFormData);
      
      if (response.success && response.data) {
        setPharmacists((prev: Pharmacist[]) => [...prev, response.data!]);
        setPharmacistForm({
          name: '',
          surname: '',
          pNumber: '',
          password: ''
        });
        setShowCreateModal(false);
      } else {
        setError(response.message || 'Failed to create pharmacist');
      }
    } catch (err) {
      console.error('Error creating pharmacist:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create pharmacist');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePharmacist = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pharmacist?')) {
      return;
    }

    setError(null);

    try {
      const response = await pharmacistApi.deletePharmacist(id);
      
      if (response.success) {
        setPharmacists((prev: Pharmacist[]) => prev.filter((p: Pharmacist) => p.id !== id));
        setSelectedPharmacist(null);
      } else {
        setError(response.message || 'Failed to delete pharmacist');
      }
    } catch (err) {
      console.error('Error deleting pharmacist:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to delete pharmacist');
    }
  };

  const isFormValid = () => {
    return (
      pharmacistForm.name.trim() !== '' &&
      pharmacistForm.surname.trim() !== '' &&
      pharmacistForm.pNumber.trim() !== '' &&
      pharmacistForm.password.trim() !== ''
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
  };

  const openCreateModal = () => {
    setPharmacistForm({
      name: '',
      surname: '',
      pNumber: '',
      password: ''
    });
    setError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="manage-pharmacists-page">
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
            <p className="user-info">Admin Panel</p>
          </div>
          <div className="header-right">
            <button className="logout-btn" onClick={handleLogout}>
              <img src="/logout-svgrepo-com.svg" alt="Logout" className="logout-icon" />
              Logout
            </button>
          </div>
        </div>
        <div className="loading-message">Loading pharmacists...</div>
      </div>
    );
  }

  return (
    <div className="manage-pharmacists-page">
      {/* Header */}
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
          <p className="user-info">Pharmacist Management</p>
        </div>
        <div className="header-right">
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
              <h2 className="page-title">Manage Pharmacists</h2>
              <p className="pharmacist-count">{pharmacists.length} pharmacist{pharmacists.length !== 1 ? 's' : ''} registered</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={openCreateModal}>
                Add New Pharmacist
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Pharmacists Table */}
          <div className="pharmacists-table-container">
            {pharmacists.length === 0 ? (
              <div className="no-pharmacists-message">
                <h3>No Pharmacists Found</h3>
                <p>Get started by adding your first pharmacist account.</p>
                <button className="btn btn-primary" onClick={openCreateModal}>
                  Add First Pharmacist
                </button>
              </div>
            ) : (
              <table className="pharmacists-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>P-Number</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacists.map((pharmacist: Pharmacist) => (
                    <tr 
                      key={pharmacist.id}
                      className={selectedPharmacist === pharmacist.id ? 'selected' : ''}
                      onClick={() => setSelectedPharmacist(
                        selectedPharmacist === pharmacist.id ? null : pharmacist.id
                      )}
                    >
                      <td className="pharmacist-name">
                        <strong>{pharmacist.name}</strong>
                      </td>
                      <td>{pharmacist.surname}</td>
                      <td className="p-number">{pharmacist.pNumber}</td>
                      <td>{formatDate(pharmacist.createdAt)}</td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-danger btn-small"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeletePharmacist(pharmacist.id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Pharmacist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Pharmacist</h3>
              <button className="close-btn" onClick={closeCreateModal}>×</button>
            </div>
            
            <div className="modal-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="pharmacist-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={pharmacistForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                      placeholder="Enter first name"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Surname</label>
                    <input
                      type="text"
                      className="form-input"
                      value={pharmacistForm.surname}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('surname', e.target.value)}
                      placeholder="Enter surname"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">P-Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={pharmacistForm.pNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('pNumber', e.target.value)}
                      placeholder="e.g., P-10515"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={pharmacistForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password"
                      disabled={isCreating}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeCreateModal}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${isFormValid() && !isCreating ? 'enabled' : 'disabled'}`}
                onClick={handleCreatePharmacist}
                disabled={!isFormValid() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Pharmacist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePharmacistsPage;