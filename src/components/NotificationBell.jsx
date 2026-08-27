import { useState, useEffect, useCallback, useRef } from 'react';
import { getTickets } from '../lib/api';
import { slaStatus } from '../lib/sla';
import './NotificationBell.css';

function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const dropdownRef = useRef(null);

  const loadAlerts = useCallback(async () => {
    const tickets = await getTickets();
    const now = Date.now();
    
    const breached = [];
    const atRisk = [];
    const info = [];

    tickets.forEach(ticket => {
      const status = slaStatus(ticket, now);

      if (ticket.priority === 'P1' && status === 'breached') {
        breached.push({
          id: `breach-${ticket.id}`,
          type: 'breached',
          priority: ticket.priority,
          ticketId: ticket.id,
          subject: ticket.subject,
          message: `P1 Ticket BREACHED: ${ticket.id}`
        });
      } else if (status === 'at-risk') {
        atRisk.push({
          id: `risk-${ticket.id}`,
          type: 'at-risk',
          priority: ticket.priority,
          ticketId: ticket.id,
          subject: ticket.subject,
          message: `${ticket.priority} AT RISK: ${ticket.id}`
        });
      }
    });

    const unassigned = tickets.filter(t => !t.assignee && t.status !== 'resolved' && t.status !== 'closed');
    if (unassigned.length > 0) {
      info.push({
        id: 'unassigned-alert',
        type: 'info',
        message: `${unassigned.length} unassigned ticket${unassigned.length > 1 ? 's' : ''}`
      });
    }

    const p1Unassigned = tickets.filter(t => t.priority === 'P1' && !t.assignee && t.status !== 'resolved' && t.status !== 'closed');
    if (p1Unassigned.length > 0) {
      info.push({
        id: 'p1-unassigned',
        type: 'new-p1',
        message: `P1 unassigned: ${p1Unassigned.length}`
      });
    }

    setAlerts([...breached, ...atRisk, ...info]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAlerts();
    }, 100);
    const interval = setInterval(loadAlerts, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadAlerts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const breachedCount = alerts.filter(a => a.type === 'breached').length;
  const atRiskCount = alerts.filter(a => a.type === 'at-risk').length;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="bell-button" 
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {(breachedCount + atRiskCount) > 0 && (
          <span className="bell-badge">{breachedCount + atRiskCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span className="notification-title">Alerts</span>
            <span className="notification-counts">
              {breachedCount > 0 && <span className="count-breached">{breachedCount} breached</span>}
              {atRiskCount > 0 && <span className="count-atrisk">{atRiskCount} at risk</span>}
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="notification-empty">
              <span className="empty-icon">✓</span>
              <span>All clear! No alerts</span>
            </div>
          ) : (
            <div className="notification-list">
              {alerts.map((alert) => (
                <div key={alert.id} className={`notification-item ${alert.type}`}>
                  <span className="notification-icon">
                    {alert.type === 'breached' ? '⚠️' : 
                     alert.type === 'at-risk' ? '⚡' : 
                     alert.type === 'new-p1' ? '🔴' : 'ℹ️'}
                  </span>
                  <span className="notification-message">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="notification-footer">
            <div className="daily-digest">
              Daily: {breachedCount} breached, {alerts.filter(a => a.type === 'info').length} unassigned
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;