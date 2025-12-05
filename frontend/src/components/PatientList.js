import React, { useState, useEffect } from 'react';
import './PatientList.css';
import { apiService } from '../services/apiService';

const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Debounce the search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Fetch patients with pagination and search
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getPatients(currentPage, 10, debouncedSearchTerm);
      setPatients(response.patients || []);
      setPagination(response.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]);

  // Handle search input changes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>Patients</h2>
        <input
          type="text"
          placeholder="Search patients..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <div className="loading">Loading patients...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : (
        <>
          <div className="patient-list">
            {patients.length === 0 ? (
              <div className="placeholder">
                <p>No patients found</p>
                {searchTerm && <p>Try adjusting your search terms</p>}
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.id}
                  className="patient-card"
                  onClick={() => onSelectPatient(patient.id)}
                >
                  <div className="patient-card-header">
                    <div>
                      <div className="patient-name">{patient.name}</div>
                      <div className="patient-id">{patient.patientId}</div>
                    </div>
                  </div>
                  <div className="patient-info">
                    <div className="patient-info-item">
                      <span>📧</span>
                      <span>{patient.email}</span>
                    </div>
                    <div className="patient-info-item">
                      <span>📞</span>
                      <span>{patient.phone}</span>
                    </div>
                    <div className="patient-info-item">
                      <span>🎂</span>
                      <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                    <div className="patient-info-item">
                      <span>{patient.gender === 'Male' ? '👨' : '👩'}</span>
                      <span>{patient.gender}</span>
                    </div>
                  </div>
                  {patient.walletAddress && (
                    <div className="patient-wallet">
                      🔐 {patient.walletAddress}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
                {' '}({pagination.total} total patients)
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientList;


