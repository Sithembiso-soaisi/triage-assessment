// src/pages/Board.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { loadTickets } from '../lib/api';
import { calculateSLAUrgency, getPriorityInfo, getStatusInfo } from '../lib/sla';
import '../App.css';

const Board = () => {
  // State for tickets and loading
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters (your responsibility)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'urgency' // urgency sorting
  });

  // Load tickets on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await loadTickets();
        setTickets(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load tickets');
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Filter and sort tickets (your main logic)
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

    // Urgency sorting (your responsibility)
    if (filters.sortBy === 'urgency') {
      result.sort((a, b) => {
        const urgencyA = calculateSLAUrgency(a);
        const urgencyB = calculateSLAUrgency(b);
        return urgencyB.urgency - urgencyA.urgency;
      });
    } else if (filters.sortBy === 'created') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === 'priority') {
      const priorityOrder = { 'P1': 4, 'P2': 3, 'P3': 2, 'P4': 1 };
      result.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }

    return result;
  }, [tickets, filters]);

  // Summary information (your responsibility)
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
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading tickets...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <span className="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="board-container">
      {/* Summary Information - Your Responsibility */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total Tickets</span>
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
          <span className="summary-label">P1 Critical</span>
          <span className="summary-value">{stats.p1}</span>
        </div>
        <div className="summary-card priority-p2">
          <span className="summary-label">P2 High</span>
          <span className="summary-value">{stats.p2}</span>
        </div>
        <div className="summary-card priority-p3">
          <span className="summary-label">P3 Medium</span>
          <span className="summary-value">{stats.p3}</span>
        </div>
        <div className="summary-card priority-p4">
          <span className="summary-label">P4 Low</span>
          <span className="summary-value">{stats.p4}</span>
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
          placeholder="Search tickets..."
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
          <span>SLA Urgency</span>
          <span>Assignee</span>
          <span>Action</span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets match your filters</p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            // Display SLA urgency information - Your Responsibility
            const sla = calculateSLAUrgency(ticket);
            const priorityInfo = getPriorityInfo(ticket.priority);
            const statusInfo = getStatusInfo(ticket.status);
            
            return (
              <div key={ticket.id} className={`ticket-row priority-${ticket.priority}`}>
                <div className="ticket-info">
                  <span className="ticket-id">{ticket.id}</span>
                  <div className="ticket-subject">
                    <Link to={`/ticket/${ticket.id}`}>{ticket.subject}</Link>
                    <span className="ticket-requester">by {ticket.requester}</span>
                  </div>
                </div>
                
                <span className="priority-badge" style={{ background: priorityInfo.color }}>
                  {ticket.priority}
                </span>
                
                <span className="status-badge" style={{ background: statusInfo.color }}>
                  {ticket.status}
                </span>
                
                {/* SLA Urgency Display - Your Responsibility */}
                <div className="sla-display">
                  <div className={`sla-bar ${sla.status}`}>
                    <div className="sla-fill" style={{ width: `${sla.percentage}%` }}></div>
                  </div>
                  <span className={`sla-text ${sla.status}`}>
                    {sla.percentage}% {sla.status === 'critical' && '⚠️'}
                  </span>
                </div>
                
                <span className="assignee">{ticket.assignee || 'Unassigned'}</span>
                <Link to={`/ticket/${ticket.id}`} className="view-btn">View</Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Board;