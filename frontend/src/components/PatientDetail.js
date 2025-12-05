import React, { useState, useEffect } from 'react';
import './PatientDetail.css';
import { apiService } from '../services/apiService';

const PatientDetail = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRecords, setExpandedRecords] = useState({});

  // Fetch patient data and records
  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch patient details and records in parallel
        const [patientData, recordsData] = await Promise.all([
          apiService.getPatient(patientId),
          apiService.getPatientRecords(patientId)
        ]);
        setPatient(patientData);
        setRecords(recordsData.records || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  // Toggle record description expansion
  const toggleRecordExpansion = (recordId) => {
    setExpandedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  if (loading) {
    return (
      <div className="patient-detail-container">
        <div className="loading">Loading patient details...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="patient-detail-container">
        <div className="error">Error loading patient: {error || 'Patient not found'}</div>
        <button onClick={onBack} className="back-btn">Back to List</button>
      </div>
    );
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-detail-header">
        <button onClick={onBack} className="back-btn">← Back to List</button>
      </div>

      <div className="patient-detail-content">
        {/* Patient Information Section */}
        <div className="patient-info-section">
          <h2>Patient Information</h2>
          <div className="patient-info-grid">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{patient.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Patient ID</span>
              <span className="info-value">{patient.patientId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{patient.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{patient.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">
                {new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender</span>
              <span className="info-value">{patient.gender}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Address</span>
              <span className="info-value">{patient.address}</span>
            </div>
            {patient.walletAddress && (
              <div className="info-item">
                <span className="info-label">Wallet Address</span>
                <span className="info-value wallet">{patient.walletAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medical Records Section */}
        <div className="patient-records-section">
          <h2>Medical Records ({records.length})</h2>
          {records.length === 0 ? (
            <div className="placeholder">
              <p>No medical records found for this patient</p>
            </div>
          ) : (
            <div className="records-list">
              {records.map((record) => {
                const isExpanded = expandedRecords[record.id];
                const shouldTruncate = record.description.length > 200;
                
                return (
                  <div key={record.id} className="record-card">
                    <div className="record-header">
                      <div className="record-title">{record.title}</div>
                      <span className={`record-type ${record.type.split(' ')[0].toLowerCase()}`}>
                        {record.type}
                      </span>
                    </div>
                    
                    <p className="record-description">
                      {isExpanded || !shouldTruncate
                        ? record.description
                        : `${record.description.substring(0, 200)}...`}
                    </p>
                    
                    {shouldTruncate && (
                      <button
                        onClick={() => toggleRecordExpansion(record.id)}
                        className="read-more-btn"
                      >
                        {isExpanded ? '← Read less' : 'Read more →'}
                      </button>
                    )}
                    
                    <div className="record-meta">
                      <div className="record-meta-item">
                        <span>📅</span>
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <div className="record-meta-item">
                        <span>👨‍⚕️</span>
                        <span>{record.doctor}</span>
                      </div>
                      <div className="record-meta-item">
                        <span>🏥</span>
                        <span>{record.hospital}</span>
                      </div>
                      {record.status && (
                        <div className={`record-status ${record.status}`}>
                          {record.status === 'verified' ? '✓' : '⏳'} {record.status}
                        </div>
                      )}
                    </div>
                    
                    {record.blockchainHash && (
                      <div className="record-meta" style={{ marginTop: '0.5rem' }}>
                        <div className="record-meta-item">
                          <span>🔗</span>
                          <span className="blockchain-hash">
                            {record.blockchainHash}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;


