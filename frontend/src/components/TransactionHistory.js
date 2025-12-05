import React, { useState, useEffect } from 'react';
import './TransactionHistory.css';
import { apiService } from '../services/apiService';

const TransactionHistory = ({ account }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterWallet, setFilterWallet] = useState('');
  const [customWalletInput, setCustomWalletInput] = useState('');
  const [useConnectedWallet, setUseConnectedWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        let walletAddress = filterWallet || null;
        const data = await apiService.getTransactions(walletAddress, 50);
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [account, filterWallet, useConnectedWallet]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearFilter = () => {
    setFilterWallet('');
    setCustomWalletInput('');
    setUseConnectedWallet(false);
  };

  const handleApplyCustomFilter = () => {
    if (customWalletInput.trim()) {
      setFilterWallet(customWalletInput.trim());
      setUseConnectedWallet(false);
    }
  };

  const getActiveFilter = () => {
    if (filterWallet) return filterWallet;
    if (useConnectedWallet && account) return account;
    return null;
  };

  const copyToClipboard = async (address, txId) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(txId);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      alert('Failed to copy address');
    }
  };

  if (loading) {
    return (
      <div className="transaction-history-container">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="transaction-history-container">
      <div className="transaction-header">
        <h2>Transaction History</h2>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-input-group">
          <input
            type="text"
            className="wallet-input"
            placeholder="Enter wallet address to filter..."
            value={customWalletInput}
            onChange={(e) => setCustomWalletInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleApplyCustomFilter()}
          />
          <button
            className="apply-filter-btn"
            onClick={handleApplyCustomFilter}
            disabled={!customWalletInput.trim()}
          >
            Apply Filter
          </button>
        </div>

        {getActiveFilter() && (
          <div className="active-filter">
            <span className="filter-label">Active Filter:</span>
            <span className="filter-address">{formatAddress(getActiveFilter())}</span>
            <button className="clear-filter-btn" onClick={handleClearFilter}>
              Clear
            </button>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found</p>
          {getActiveFilter() && (
            <p className="hint">No transactions for this wallet address. Try clearing the filter.</p>
          )}
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-card">
              <div className="transaction-header-info">
                <div>
                  <span className={`transaction-type ${tx.type}`}>
                    {tx.type.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className={`transaction-status ${tx.status}`}>
                    <span className="status-indicator"></span>
                    {tx.status}
                  </span>
                </div>
              </div>

              <div className="transaction-details">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">From</span>
                  <div 
                    className="address-with-copy"
                    onClick={() => copyToClipboard(tx.from, `${tx.id}-from`)}
                    title="Copy full address"
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && copyToClipboard(tx.from, `${tx.id}-from`)}
                  >
                    <span className="copy-icon">
                      {copiedAddress === `${tx.id}-from` ? '✓' : '🔗'}
                    </span>
                    <span className="transaction-detail-value address">
                      {formatAddress(tx.from)}
                    </span>
                  </div>
                </div>

                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">To</span>
                  <div 
                    className="address-with-copy"
                    onClick={() => copyToClipboard(tx.to, `${tx.id}-to`)}
                    title="Copy full address"
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && copyToClipboard(tx.to, `${tx.id}-to`)}
                  >
                    <span className="copy-icon">
                      {copiedAddress === `${tx.id}-to` ? '✓' : '🔗'}
                    </span>
                    <span className="transaction-detail-value address">
                      {formatAddress(tx.to)}
                    </span>
                  </div>
                </div>

                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Amount</span>
                  <span className="transaction-detail-value transaction-amount">
                    {tx.amount} {tx.currency}
                  </span>
                </div>

                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Timestamp</span>
                  <span className="transaction-detail-value transaction-timestamp">
                    {formatDate(tx.timestamp)}
                  </span>
                </div>
              </div>

              {tx.blockchainTxHash && (
                <div className="transaction-hash">
                  <span className="transaction-detail-label">Transaction Hash</span>
                  <span className="transaction-detail-value hash">
                    {tx.blockchainTxHash}
                  </span>
                </div>
              )}

              {tx.blockNumber && (
                <div className="transaction-block-info">
                  <span className="block-detail">Block: {tx.blockNumber}</span>
                  {tx.gasUsed && (
                    <span className="block-detail">Gas Used: {parseInt(tx.gasUsed).toLocaleString()}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;


