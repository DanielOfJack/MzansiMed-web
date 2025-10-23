import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CheckInstructionsPage.css';
import { whatsappApi } from '../services/api'; // Import your new API function

interface MedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  interval: string;
  timeOfDay: string;
  precautions: string[];
}

interface InstructionDisplay {
  english: string;
  translated: string;
  selectedLanguage: string;
}

interface MedicationTab {
  id: number;
  name: string;
  isActive: boolean;
  formData: MedicationForm;
  instructions: InstructionDisplay;
}

const CheckInstructionsPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const medicationsPerPage = 4;
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get medications from localStorage (from Add Medications page)
  const [medicationTabs, setMedicationTabs] = useState<MedicationTab[]>([]);

  useEffect(() => {
    // Retrieve medication data from localStorage
    const storedTabs = localStorage.getItem('medicationTabs');
    if (storedTabs) {
      try {
        const parsedTabs = JSON.parse(storedTabs);
        setMedicationTabs(parsedTabs);
      } catch (error) {
        console.error('Error parsing medication tabs:', error);
      }
    }
  }, []);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle instruction changes and save to localStorage
  const handleInstructionChange = (medicationId: number, type: 'english' | 'translated', value: string) => {
    const updatedTabs = medicationTabs.map(tab => 
      tab.id === medicationId 
        ? { 
            ...tab, 
            instructions: { 
              ...tab.instructions, 
              [type]: value 
            } 
          }
        : tab
    );
    setMedicationTabs(updatedTabs);
    localStorage.setItem('medicationTabs', JSON.stringify(updatedTabs));
  };

  const handleBackToMedications = () => {
    navigate('/add-medication');
  };

  const sendWhatsAppMessage = async () => {
    setIsLoading(true);
    try {
      // Get patientId from localStorage or your state
      const patientData = localStorage.getItem('patientData');
      const patientId = patientData ? JSON.parse(patientData).id : null;
      if (!patientId) throw new Error('No patient ID found');

      // Call backend to send WhatsApp message securely
      await whatsappApi.sendMessage(patientId, "hello_world", "en_US");

      alert('Message sent successfully to WhatsApp!');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      alert('An error occurred while sending the message.');
    } finally {
      setIsLoading(false);
      setShowWhatsAppModal(false);
    }
  };

  // const sendWhatsAppMessage = async () => {
  //   setIsLoading(true);
  //   try {
  //     // WhatsApp API configuration
  //     const phoneNumberId = '15551561638'; // Test number provided
  //     const accessToken = 'EAAaPekkgN14BPXUKCBcX8mvIn9R0d4MZAS3aUnSgjwie4d4ME1ZAmCWLnks0m7T0uBHVtMMBCyxXIpjoQm4ZANR8uldTgx7cIf5FfHBojWNpVJOUVYfZAm0xajXKEbnREk5d535XKv7NmmnrZB8YrNFF1oHzZCWPiW4UeeZAuynZAmiMNMCIxZBCDjpFVEH6aHt8hDIZCRBHnog1WZBTgfuEVX7eX0VuqulVZBcZBDypGEFJfDrKZAOwZDZD';
  //     const recipientNumber = '+27791875164';

  //     const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${accessToken}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         messaging_product: 'whatsapp',
  //         to: recipientNumber,
  //         type: 'template',
  //         template: {
  //           name: 'hello_world',
  //           language: {
  //             code: 'en_US'
  //           }
  //         }
  //       })
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       console.log('WhatsApp message sent successfully:', result);
  //       alert('Message sent successfully to WhatsApp!');
  //     } else {
  //       const error = await response.json();
  //       console.error('Failed to send WhatsApp message:', error);
  //       alert('Failed to send message. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error sending WhatsApp message:', error);
  //     alert('An error occurred while sending the message.');
  //   } finally {
  //     setIsLoading(false);
  //     setShowWhatsAppModal(false);
  //   }
  // };

  const handleSendToWhatsApp = () => {
    setShowWhatsAppModal(true);
  };

  const handleModalConfirm = () => {
    sendWhatsAppMessage();
  };

  const handleModalCancel = () => {
    setShowWhatsAppModal(false);
  };

  const totalPages = Math.ceil(medicationTabs.length / medicationsPerPage);
  const startIndex = currentPage * medicationsPerPage;
  const endIndex = startIndex + medicationsPerPage;
  const currentMedications = medicationTabs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="check-instructions-page">
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

      <div className="language-selection-bar">
        <div className="container">
          <div className="banner-left">
            <h2>Review All Medications</h2>
          </div>
          <div className="banner-right">
            {/* Buttons removed - now at bottom */}
          </div>
        </div>
      </div>

      <div className="main-content">
        {medicationTabs.length === 0 ? (
          <div className="no-medications">
            <p>No medications have been added yet.</p>
            <button className="btn btn-primary" onClick={handleBackToMedications}>
              Add Your First Medication
            </button>
          </div>
        ) : (
          <>
            <div className="medications-grid">
              {currentMedications.map((medication) => (
                <div key={medication.id} className="medication-card">
                  <div className="medication-header">
                    <h3>{medication.name || `Medication ${medication.id}`}</h3>
                  </div>
                  
                  <div className="instruction-section">
                    <h4>English Instructions</h4>
                    <div className="instruction-content">
                      <textarea
                        className="instruction-textarea"
                        value={medication.instructions.english || ''}
                        onChange={(e) => handleInstructionChange(medication.id, 'english', e.target.value)}
                        placeholder="No instructions generated yet."
                        rows={6}
                      />
                    </div>
                  </div>
                  
                  <div className="instruction-section">
                    <h4>Translated Instructions</h4>
                    <div className="instruction-content">
                      <textarea
                        className="instruction-textarea"
                        value={medication.instructions.translated || ''}
                        onChange={(e) => handleInstructionChange(medication.id, 'translated', e.target.value)}
                        placeholder="This will have the translated instructions"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-secondary" 
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                >
                  Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index}
                      className={`page-btn ${currentPage === index ? 'active' : ''}`}
                      onClick={() => goToPage(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="btn btn-secondary" 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
            
            <div className="continue-section">
              <button className="btn btn-secondary" onClick={handleBackToMedications}>
                Add Medication
              </button>
              <button 
                className="continue-btn-large"
                onClick={handleSendToWhatsApp}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send to WhatsApp'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* WhatsApp Confirmation Modal */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={handleModalCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Instructions to WhatsApp</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to send the medication instructions via WhatsApp?</p>
              <div className="modal-details">
                <p><strong>Recipient:</strong> +27 791875164</p>
                <p><strong>Message:</strong> Hello World (Test Message)</p>
                <p><strong>Total Medications:</strong> {medicationTabs.length}</p>
              </div>
              <p className="modal-note">
                <em>Note: This will send a test "Hello World" message to verify the WhatsApp integration.</em>
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={handleModalCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleModalConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Yes, Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInstructionsPage;
