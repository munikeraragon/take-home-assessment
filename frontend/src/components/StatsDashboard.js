import React, { useState, useEffect } from 'react';
import './StatsDashboard.css';
import { apiService } from '../services/apiService';

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Only show loader on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await apiService.getStats();
        setStats(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [isInitialLoad]);

  if (loading) {
    return (
      <div className="stats-dashboard-container">
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-dashboard-container">
        <div className="error">Error loading statistics: {error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="stats-dashboard-container">
      <div className="dashboard-header">
        <h2>Platform Statistics</h2>
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Patients</div>
          <div className="stat-value">{stats.totalPatients}</div>
          <div className="stat-description">Registered in the system</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Medical Records</div>
          <div className="stat-value">{stats.totalRecords}</div>
          <div className="stat-description">Total records stored</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Consents</div>
          <div className="stat-value">{stats.totalConsents}</div>
          <div className="stat-description">Consent agreements created</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Consents</div>
          <div className="stat-value">{stats.activeConsents}</div>
          <div className="stat-description">Currently active agreements</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending Consents</div>
          <div className="stat-value">{stats.pendingConsents}</div>
          <div className="stat-description">Awaiting approval</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Blockchain Transactions</div>
          <div className="stat-value">{stats.totalTransactions}</div>
          <div className="stat-description">Total transactions recorded</div>
        </div>
      </div>

      <div className="auto-refresh-note">
        <span>📊 Auto-refreshes every 30 seconds</span>
      </div>
    </div>
  );
};

export default StatsDashboard;


