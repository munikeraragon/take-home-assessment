import React, { useState, useEffect } from 'react';
import './ConsentManagement.css';
import { apiService } from '../services/apiService';
import { useWeb3 } from '../hooks/useWeb3';

const ConsentManagement = ({ account }) => {
  const { signMessage } = useWeb3();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    purpose: '',
  });

  // Fetch consents with optional status filter
  useEffect(() => {
    const fetchConsents = async () => {
      setLoading(true);
      setError(null);
      try {
        const status = filterStatus === 'all' ? null : filterStatus;
        const response = await apiService.getConsents(null, status);
        setConsents(response.consents || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch consents');
      } finally {
        setLoading(false);
      }
    };

    fetchConsents();
  }, [filterStatus]);

  // Create consent with MetaMask signature
  const handleCreateConsent = async (e) => {
    e.preventDefault();
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Create message to sign
      const message = `I consent to: ${formData.purpose} for patient: ${formData.patientId}`;
      
      // Sign message with MetaMask
      const signature = await signMessage(message);
      
      // Create consent with signature
      await apiService.createConsent({
        patientId: formData.patientId,
        purpose: formData.purpose,
        walletAddress: account,
        signature: signature
      });
      
      // Refresh consents list
      const response = await apiService.getConsents(null, filterStatus === 'all' ? null : filterStatus);
      setConsents(response.consents || []);
      
      // Reset form
      setFormData({ patientId: '', purpose: '' });
      setShowCreateForm(false);
      
      alert('Consent created successfully!');
    } catch (err) {
      alert('Failed to create consent: ' + err.message);
    }
  };

  // Update consent status
  const handleUpdateStatus = async (consentId, newStatus) => {
    try {
      await apiService.updateConsent(consentId, { status: newStatus });
      
      // Refresh consents list
      const response = await apiService.getConsents(null, filterStatus === 'all' ? null : filterStatus);
      setConsents(response.consents || []);
      
      alert(`Consent status updated to ${newStatus}!`);
    } catch (err) {
      alert('Failed to update consent: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="consent-management-container">
        <div className="loading">Loading consents...</div>
      </div>
    );
  }

  return (
    <div className="consent-management-container">
      <div className="consent-header">
        <h2>Consent Management</h2>
        <button
          className="create-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!account}
        >
          {showCreateForm ? 'Cancel' : 'Create New Consent'}
        </button>
      </div>

      {!account && (
        <div className="warning">
          Please connect your MetaMask wallet to manage consents
        </div>
      )}

      {showCreateForm && account && (
        <div className="create-consent-form">
          <h3>Create New Consent</h3>
          <form onSubmit={handleCreateConsent}>
            <div className="form-group">
              <label>Patient ID</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                placeholder="e.g., patient-001"
              />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
              >
                <option value="">Select purpose...</option>
                <option value="Research Study Participation">Research Study Participation</option>
                <option value="Data Sharing with Research Institution">Data Sharing with Research Institution</option>
                <option value="Third-Party Analytics Access">Third-Party Analytics Access</option>
                <option value="Insurance Provider Access">Insurance Provider Access</option>
              </select>
            </div>
            <button type="submit" className="submit-btn">
              Sign & Create Consent
            </button>
          </form>
        </div>
      )}

      <div className="consent-filters">
        <button
          className={filterStatus === 'all' ? 'active' : ''}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button
          className={filterStatus === 'active' ? 'active' : ''}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </button>
        <button
          className={filterStatus === 'pending' ? 'active' : ''}
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </button>
      </div>

      {/* Display consents list */}
      <div className="consents-list">
        {error && <div className="error">Error: {error}</div>}
        
        {consents.length === 0 ? (
          <div className="placeholder">
            <p>No consents found</p>
            {filterStatus !== 'all' && <p>Try adjusting your filters</p>}
          </div>
        ) : (
          consents.map((consent) => (
            <div key={consent.id} className="consent-card">
              <div className="consent-card-header">
                <div>
                  <div className="consent-purpose">{consent.purpose}</div>
                  <div className="consent-patient">Patient: {consent.patientId}</div>
                </div>
                <span className={`consent-status-badge ${consent.status}`}>
                  {consent.status}
                </span>
              </div>
              
              <div className="consent-details">
                <div className="consent-detail-item">
                  <span className="label">Wallet Address:</span>
                  <span className="value wallet-address">{consent.walletAddress}</span>
                </div>
                <div className="consent-detail-item">
                  <span className="label">Created:</span>
                  <span className="value">
                    {new Date(consent.createdAt).toLocaleString()}
                  </span>
                </div>
                {consent.blockchainTxHash && (
                  <div className="consent-detail-item">
                    <span className="label">Blockchain TX:</span>
                    <span className="value tx-hash">{consent.blockchainTxHash}</span>
                  </div>
                )}
                {consent.signature && (
                  <div className="consent-detail-item">
                    <span className="label">Signature:</span>
                    <span className="value signature">
                      {consent.signature.substring(0, 20)}...{consent.signature.substring(consent.signature.length - 20)}
                    </span>
                  </div>
                )}
              </div>
              
              {consent.status === 'pending' && (
                <div className="consent-actions">
                  <button
                    className="action-btn approve"
                    onClick={() => handleUpdateStatus(consent.id, 'active')}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="action-btn reject"
                    onClick={() => handleUpdateStatus(consent.id, 'revoked')}
                  >
                    ✗ Revoke
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsentManagement;


