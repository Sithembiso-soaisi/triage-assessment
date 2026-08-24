// src/pages/Board.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../lib/api';
import { slaStatus, formatRemaining, msRemaining } from '../lib/sla';
import './Board.css';

const Board = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'urgency'
  });

  // Load tickets using the existing getTickets function
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTickets();
        setTickets(data);
        setLoading(false);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError('Failed to load tickets');
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Get urgency score for sorting
  const getUrgencyScore = (ticket) => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const remaining = msRemaining(ticket, now);
    const slaMilliseconds = ticket.priority === 'P1' ? 3600000 :
                           ticket.priority === 'P2' ? 14400000 :
                           ticket.priority === 'P3' ? 86400000 :
                           ticket.priority === 'P4' ? 259200000 : 86400000;
    
    if (remaining < 0) return 1;
    if (remaining < slaMilliseconds * 0.25) return 0.8;
    const timePassed = slaMilliseconds - remaining;
    return timePassed / slaMilliseconds;
  };

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(ticket =>
        ticket.id.toLowerCase().includes(searchTerm) ||
        ticket.subject.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm) ||
        ticket.requester.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(ticket => ticket.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      result = result.filter(ticket => ticket.priority === filters.priority);
    }

    // Sorting
    if (filters.sortBy === 'urgency') {
      result.sort((a, b) => {
        const scoreA = getUrgencyScore(a);
        const scoreB = getUrgencyScore(b);
        return scoreB - scoreA;
      });
    } else if (filters.sortBy === 'created') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === 'priority') {
      const priorityOrder = { 'P1': 4, 'P2': 3, 'P3': 2, 'P4': 1 };
      result.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }

    return result;
  }, [tickets, filters]);

  // Get SLA display info for a ticket
  const getSLADisplay = (ticket) => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const status = slaStatus(ticket, now);
    const remaining = msRemaining(ticket, now);
    const formatted = formatRemaining(remaining);
    
    const slaMilliseconds = ticket.priority === 'P1' ? 3600000 :
                           ticket.priority === 'P2' ? 14400000 :
                           ticket.priority === 'P3' ? 86400000 :
                           ticket.priority === 'P4' ? 259200000 : 86400000;
    
    let percentage = 0;
    if (remaining > 0) {
      percentage = (remaining / slaMilliseconds) * 100;
    }
    
    return { status, formatted, percentage: Math.min(percentage, 100) };
  };

  // Calculate summary statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    p1: tickets.filter(t => t.priority === 'P1').length,
    p2: tickets.filter(t => t.priority === 'P2').length,
    p3: tickets.filter(t => t.priority === 'P3').length,
    p4: tickets.filter(t => t.priority === 'P4').length,
    unassigned: tickets.filter(t => t.assignee === null).length,
    // eslint-disable-next-line react-hooks/purity
    breached: tickets.filter(t => slaStatus(t, Date.now()) === 'breached').length,
    // eslint-disable-next-line react-hooks/purity
    atRisk: tickets.filter(t => slaStatus(t, Date.now()) === 'at-risk').length,
  };

  // Loading state
  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading tickets...</p>
    </div>
  );

  // Error state
  if (error) return (
    <div className="error-container">
      <span className="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  );

  // Priority colors
  const priorityColors = {
    'P1': '#dc3545',
    'P2': '#fd7e14',
    'P3': '#ffc107',
    'P4': '#28a745'
  };
  
  // Status colors
  const statusColors = {
    'open': '#007bff',
    'in-progress': '#ffc107',
    'resolved': '#28a745',
    'closed': '#6c757d'
  };
  
  // SLA status colors
  const slaColors = {
    met: '#28a745',
    ok: '#007bff',
    'at-risk': '#ffc107',
    breached: '#dc3545',
  };

  return (
    <div className="board-container">
      {/* Summary Cards - Your Responsibility */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total</span>
          <span className="summary-value">{stats.total}</span>
        </div>
        <div className="summary-card status-open">
          <span className="summary-label">Open</span>
          <span className="summary-value">{stats.open}</span>
        </div>
        <div className="summary-card status-progress">
          <span className="summary-label">In Progress</span>
          <span className="summary-value">{stats.inProgress}</span>
        </div>
        <div className="summary-card status-resolved">
          <span className="summary-label">Resolved</span>
          <span className="summary-value">{stats.resolved}</span>
        </div>
        <div className="summary-card priority-p1">
          <span className="summary-label">P1</span>
          <span className="summary-value">{stats.p1}</span>
        </div>
        <div className="summary-card priority-p2">
          <span className="summary-label">P2</span>
          <span className="summary-value">{stats.p2}</span>
        </div>
        <div className="summary-card priority-p3">
          <span className="summary-label">P3</span>
          <span className="summary-value">{stats.p3}</span>
        </div>
        <div className="summary-card priority-p4">
          <span className="summary-label">P4</span>
          <span className="summary-value">{stats.p4}</span>
        </div>
        <div className="summary-card sla-breached">
          <span className="summary-label">⚠️ Breached</span>
          <span className="summary-value">{stats.breached}</span>
        </div>
        <div className="summary-card sla-atrisk">
          <span className="summary-label">⚡ At Risk</span>
          <span className="summary-value">{stats.atRisk}</span>
        </div>
        <div className="summary-card assignment">
          <span className="summary-label">Unassigned</span>
          <span className="summary-value">{stats.unassigned}</span>
        </div>
      </div>

      {/* Filters - Your Responsibility */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search tickets by ID, subject, requester..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="search-input"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          className="filter-select"
        >
          <option value="all">All Priority</option>
          <option value="P1">P1 - Critical</option>
          <option value="P2">P2 - High</option>
          <option value="P3">P3 - Medium</option>
          <option value="P4">P4 - Low</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          className="filter-select"
        >
          <option value="urgency">Sort by Urgency</option>
          <option value="created">Sort by Created</option>
          <option value="priority">Sort by Priority</option>
        </select>
      </div>

      {/* Ticket Board - Your Responsibility */}
      <div className="ticket-list">
        <div className="ticket-header">
          <span>Ticket</span>
          <span>Priority</span>
          <span>Status</span>
          <span>SLA</span>
          <span>Assignee</span>
          <span>Action</span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets match your filters</p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const slaInfo = getSLADisplay(ticket);
            
            return (
              <div key={ticket.id} className={`ticket-row priority-${ticket.priority}`}>
                <div className="ticket-info">
                  <span className="ticket-id">{ticket.id}</span>
                  <div className="ticket-subject">
                    <Link to={`/tickets/${ticket.id}`}>{ticket.subject}</Link>
                    <span className="ticket-requester">by {ticket.requester}</span>
                  </div>
                </div>
                
                <span className="priority-badge" style={{ background: priorityColors[ticket.priority] }}>
                  {ticket.priority}
                </span>
                
                <span className="status-badge" style={{ background: statusColors[ticket.status] }}>
                  {ticket.status}
                </span>
                
                {/* SLA Display - Your Responsibility */}
                <div className="sla-display">
                  <div className={`sla-bar ${slaInfo.status}`}>
                    <div 
                      className="sla-fill" 
                      style={{ 
                        width: `${slaInfo.percentage}%`,
                        background: slaColors[slaInfo.status]
                      }}
                    />
                  </div>
                  <div className="sla-info">
                    <span className={`sla-status ${slaInfo.status}`}>
                      {slaInfo.status === 'breached' && '⚠️ '}
                      {slaInfo.status === 'at-risk' && '⚡ '}
                      {slaInfo.status.toUpperCase()}
                    </span>
                    <span className="sla-time">{slaInfo.formatted}</span>
                  </div>
                </div>
                
                <span className="assignee">{ticket.assignee || 'Unassigned'}</span>
                <Link to={`/tickets/${ticket.id}`} className="view-btn">View</Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Board;