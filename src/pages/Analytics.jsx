import { useState, useEffect } from 'react';
import { getTickets } from '../lib/api';
import { slaStatus } from '../lib/sla';
import './Analytics.css';

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await getTickets();
      const now = Date.now();
      const total = data.length;
      const resolved = data.filter(t => t.status === 'resolved' || t.status === 'closed');
      const open = data.filter(t => t.status === 'open' || t.status === 'in-progress');

      const avgResolutionTime = (() => {
        const resolvedWithTime = resolved.filter(t => t.resolvedAt && t.createdAt);
        if (resolvedWithTime.length === 0) return 0;
        const totalTime = resolvedWithTime.reduce((acc, t) => {
          return acc + (new Date(t.resolvedAt) - new Date(t.createdAt));
        }, 0);
        return totalTime / resolvedWithTime.length;
      })();

      const byPriority = {
        P1: data.filter(t => t.priority === 'P1').length,
        P2: data.filter(t => t.priority === 'P2').length,
        P3: data.filter(t => t.priority === 'P3').length,
        P4: data.filter(t => t.priority === 'P4').length,
      };

      const agentPerformance = {};
      data.forEach(ticket => {
        if (ticket.assignee) {
          if (!agentPerformance[ticket.assignee]) {
            agentPerformance[ticket.assignee] = { resolved: 0, total: 0 };
          }
          agentPerformance[ticket.assignee].total++;
          if (ticket.status === 'resolved' || ticket.status === 'closed') {
            agentPerformance[ticket.assignee].resolved++;
          }
        }
      });

      const byStatus = {
        open: data.filter(t => t.status === 'open').length,
        'in-progress': data.filter(t => t.status === 'in-progress').length,
        resolved: data.filter(t => t.status === 'resolved').length,
        closed: data.filter(t => t.status === 'closed').length,
      };

      const breachedByPriority = {};
      data.forEach(ticket => {
        const status = slaStatus(ticket, now);
        if (status === 'breached') {
          breachedByPriority[ticket.priority] = (breachedByPriority[ticket.priority] || 0) + 1;
        }
      });

      const totalBreached = Object.values(breachedByPriority).reduce((a, b) => a + b, 0);
      const breachedPercentages = {};
      Object.keys(breachedByPriority).forEach(priority => {
        if (totalBreached > 0) {
          breachedPercentages[priority] = Math.round((breachedByPriority[priority] / totalBreached) * 100);
        }
      });

      const priorityAvgResolution = {};
      ['P1', 'P2', 'P3', 'P4'].forEach(priority => {
        const priorityResolved = resolved.filter(t => t.priority === priority && t.resolvedAt && t.createdAt);
        if (priorityResolved.length > 0) {
          const totalTime = priorityResolved.reduce((acc, t) => {
            return acc + (new Date(t.resolvedAt) - new Date(t.createdAt));
          }, 0);
          priorityAvgResolution[priority] = totalTime / priorityResolved.length;
        } else {
          priorityAvgResolution[priority] = 0;
        }
      });

      setStats({
        total,
        resolved: resolved.length,
        open: open.length,
        avgResolutionTime,
        byPriority,
        agentPerformance,
        byStatus,
        breachedByPriority,
        breachedPercentages,
        totalBreached,
        priorityAvgResolution
      });
      setLoading(false);
    }
    loadData();
  }, []);

  const formatDuration = (ms) => {
    if (!ms || ms === 0) return 'N/A';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <h1 className="analytics-title">Analytics Dashboard</h1>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Tickets</h3>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="analytics-card">
          <h3>Open Tickets</h3>
          <div className="stat-value">{stats.open}</div>
        </div>

        <div className="analytics-card">
          <h3>Resolved Tickets</h3>
          <div className="stat-value">{stats.resolved}</div>
        </div>

        <div className="analytics-card breached-card">
          <h3>Breached Tickets</h3>
          <div className="stat-value">{stats.totalBreached}</div>
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Average Resolution Time by Priority</h2>
        <div className="resolution-cards">
          {['P1', 'P2', 'P3', 'P4'].map(priority => (
            <div key={priority} className={`resolution-card priority-${priority}`}>
              <div className="priority-label">{priority}</div>
              <div className="resolution-time">
                {formatDuration(stats.priorityAvgResolution[priority])}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Agent Performance</h2>
        <div className="agent-table">
          <div className="agent-header">
            <span>Agent</span>
            <span>Resolved</span>
            <span>Total</span>
            <span>Success Rate</span>
          </div>
          {Object.entries(stats.agentPerformance).length === 0 ? (
            <div className="empty-state">No agent data available</div>
          ) : (
            Object.entries(stats.agentPerformance)
              .sort((a, b) => b[1].resolved - a[1].resolved)
              .map(([agent, data]) => (
                <div key={agent} className="agent-row">
                  <span className="agent-name">{agent}</span>
                  <span className="agent-resolved">{data.resolved}</span>
                  <span className="agent-total">{data.total}</span>
                  <span className="agent-rate">
                    {Math.round((data.resolved / data.total) * 100)}%
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Breached Tickets by Category</h2>
        <div className="breach-breakdown">
          {stats.totalBreached === 0 ? (
            <div className="empty-state">No breached tickets</div>
          ) : (
            Object.entries(stats.breachedByPriority)
              .sort((a, b) => b[1] - a[1])
              .map(([priority, count]) => (
                <div key={priority} className={`breach-item priority-${priority}`}>
                  <div className="breach-info">
                    <span className="breach-priority">{priority}</span>
                    <span className="breach-count">{count} breached</span>
                  </div>
                  <div className="breach-bar-container">
                    <div 
                      className="breach-bar" 
                      style={{ width: `${stats.breachedPercentages[priority]}%` }}
                    />
                  </div>
                  <span className="breach-percentage">
                    {stats.breachedPercentages[priority]}%
                  </span>
                </div>
              ))
          )}
        </div>
        {stats.totalBreached > 0 && (
          <div className="breach-summary">
            {stats.breachedPercentages['P1'] >= 50 && (
              <div className="breach-alert">
                ⚠️ {stats.breachedPercentages['P1']}% of breaches are P1 tickets
              </div>
            )}
          </div>
        )}
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Ticket Distribution</h2>
        <div className="distribution-grid">
          <div className="distribution-card">
            <h4>By Priority</h4>
            <div className="distribution-bars">
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="dist-bar-item">
                  <span className="dist-label">{priority}</span>
                  <div className="dist-bar-container">
                    <div 
                      className={`dist-bar priority-${priority}`}
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="dist-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="distribution-card">
            <h4>By Status</h4>
            <div className="distribution-bars">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="dist-bar-item">
                  <span className="dist-label">{status}</span>
                  <div className="dist-bar-container">
                    <div 
                      className={`dist-bar status-${status}`}
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="dist-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;