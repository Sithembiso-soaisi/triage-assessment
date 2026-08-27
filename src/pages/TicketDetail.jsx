import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTickets, saveTicketUpdate } from "../lib/api";
import { msRemaining, formatRemaining } from "../lib/sla";
import "./TicketDetail.css";

function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState("");
  const [now, setNow] = useState(Date.now());

  // Live SLA Timer Interval
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadTicket() {
      const tickets = await getTickets();
      const foundTicket = tickets.find((item) => item.id === id);

      if (foundTicket) {
        setTicket({
          ...foundTicket,
          notes: foundTicket.notes || [],
          requesterEmail:
            foundTicket.requesterEmail ||
            `${foundTicket.requester?.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          requesterPhone: foundTicket.requesterPhone || "+1 (555) 019-2834",
          stepsToReproduce:
            foundTicket.stepsToReproduce ||
            "1. Navigate to main view.\n2. Trigger the action.\n3. Verify issue.",
          attachments: foundTicket.attachments || [],
          activityLog: foundTicket.activityLog || [
            {
              id: "act-1",
              user: foundTicket.requester || "System",
              action: "created the ticket",
              timestamp: foundTicket.createdAt,
            },
          ],
          relatedTickets: foundTicket.relatedTickets || [],
        });
      }
      setLoading(false);
    }
    loadTicket();
  }, [id]);

  const updateTicket = (updatedTicket, logMessage) => {
    let newActivityLog = updatedTicket.activityLog || [];
    if (logMessage) {
      newActivityLog = [
        {
          id: `act-${Date.now()}`,
          user: "Support Team",
          action: logMessage,
          timestamp: new Date().toISOString(),
        },
        ...newActivityLog,
      ];
    }

    const finalTicket = { ...updatedTicket, activityLog: newActivityLog };
    setTicket(finalTicket);
    saveTicketUpdate(finalTicket);
  };

  const handleStatusChange = (event) => {
    const status = event.target.value;
    updateTicket(
      {
        ...ticket,
        status,
        resolvedAt: status === "resolved" ? new Date().toISOString() : null,
      },
      `changed status to ${status.replace("-", " ")}`
    );
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body) {
      setNoteError("Enter a note before saving.");
      return;
    }

    const currentNotes = ticket.notes || [];

    updateTicket(
      {
        ...ticket,
        notes: [
          ...currentNotes,
          {
            id: `note-${Date.now()}`,
            author: "Support team",
            body,
            createdAt: new Date().toISOString(),
          },
        ],
      },
      "added an internal note"
    );

    setNoteBody("");
    setNoteError("");
  };

  // Fixed formatting logic to avoid double "Breached" / "ago"
  const getSLACountdown = () => {
    if (!ticket) return { text: "", isBreached: false };
    const remainingMs = msRemaining(ticket, now);
    const formatted = formatRemaining(remainingMs);

    if (remainingMs < 0) {
      // Strips out duplicate 'Breached' or 'ago' strings returned by helper functions
      const cleanTime = formatted.replace(/breached/gi, "").replace(/ago/gi, "").trim();
      return { text: `Breached ${cleanTime} ago`, isBreached: true };
    }
    
    const cleanTime = formatted.replace(/left/gi, "").trim();
    return { text: `${cleanTime} remaining`, isBreached: false };
  };

  if (loading) return <p className="ticket-detail-state">Loading ticket...</p>;
  if (!ticket) return <p className="ticket-detail-state">Ticket not found.</p>;

  const slaCountdown = getSLACountdown();
  const notesList = ticket.notes || [];

  return (
    <main className="ticket-detail">
      <Link className="back-link" to="/tickets">
        ← Back to board
      </Link>

      <header className="ticket-detail__header">
        <div>
          <p className="ticket-detail__id">{ticket.id}</p>
          <h1>{ticket.subject}</h1>
        </div>
        <div className="ticket-detail__badges">
          <span className={`detail-badge priority-${ticket.priority}`}>{ticket.priority}</span>
          <span className={`detail-badge status-${ticket.status}`}>
            {ticket.status.replace("-", " ")}
          </span>
        </div>
      </header>

      <section className="ticket-detail__grid">
        <div className="main-content">
          <article className="detail-card detail-card--description">
            <h2>Description</h2>
            <p>{ticket.description}</p>
          </article>

          <article className="detail-card">
            <h2>Steps to Reproduce</h2>
            <pre className="steps-text">{ticket.stepsToReproduce}</pre>
          </article>

          <article className="detail-card">
            <h2>Attachments / Screenshots</h2>

            <label className="file-upload-zone">
              <span className="file-upload-text">📁 Click to attach files</span>
              <span className="file-upload-subtext">PNG, JPG, PDF up to 10MB</span>
              <input
                type="file"
                className="file-input-hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const newAttachment = { name: file.name, url: URL.createObjectURL(file) };
                    updateTicket(
                      { ...ticket, attachments: [...ticket.attachments, newAttachment] },
                      `attached file ${file.name}`
                    );
                  }
                }}
              />
            </label>

            {ticket.attachments.length > 0 && (
              <ul className="attachment-list">
                {ticket.attachments.map((file, idx) => (
                  <li key={idx}>
                    <a href={file.url} target="_blank" rel="noreferrer">
                      📎 {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <aside className="sidebar">
          {/* SLA Timer */}
          <div className={`detail-card sla-card ${slaCountdown.isBreached ? "breached" : ""}`}>
            <h3>SLA Status</h3>
            <p className="sla-timer-text">⏱️ {slaCountdown.text}</p>
          </div>

          {/* Redesigned Profile Card */}
          <div className="detail-card requester-card">
            <div className="requester-profile">
              <div className="requester-avatar">
                {ticket.requester ? ticket.requester.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="requester-identity">
                <span className="requester-title">Requester</span>
                <h4 className="requester-name">{ticket.requester}</h4>
              </div>
            </div>

            <div className="requester-info-grid">
              <div className="info-item">
                <span className="info-label">Email</span>
                <a href={`mailto:${ticket.requesterEmail}`} className="info-value">
                  {ticket.requesterEmail}
                </a>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{ticket.requesterPhone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Assignee</span>
                <span className="info-value">{ticket.assignee ?? "Unassigned"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created</span>
                <span className="info-value">
                  {new Date(ticket.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="status-control">
              <label htmlFor="status" className="status-label">
                Ticket Status
              </label>
              <select id="status" value={ticket.status} onChange={handleStatusChange}>
                <option value="open">Open</option>
                <option value="in-progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="detail-card">
            <h3>Related Tickets</h3>
            {ticket.relatedTickets.length === 0 ? (
              <p className="empty-state">No linked duplicates.</p>
            ) : (
              <ul className="related-list">
                {ticket.relatedTickets.map((relId) => (
                  <li key={relId}>
                    <Link to={`/tickets/${relId}`}>🔗 {relId}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section className="detail-card notes-section" aria-labelledby="notes-heading">
        <div className="section-heading">
          <h2 id="notes-heading">Notes</h2>
          <p>
            {notesList.length} note{notesList.length === 1 ? "" : "s"}
          </p>
        </div>
        <form className="note-form" onSubmit={handleAddNote} noValidate>
          <label htmlFor="note">Add an internal note</label>
          <textarea
            id="note"
            value={noteBody}
            onChange={(event) => {
              setNoteBody(event.target.value);
              setNoteError("");
            }}
            placeholder="Write an update for the support team…"
            aria-describedby={noteError ? "note-error" : undefined}
          />
          {noteError && (
            <p className="form-error" id="note-error" role="alert">
              {noteError}
            </p>
          )}
          <button type="submit" className="btn-primary">
            Add note
          </button>
        </form>
        <div className="notes-list">
          {notesList.length === 0 ? (
            <p className="empty-notes">No notes yet. Add the first update above.</p>
          ) : (
            notesList.map((note) => (
              <article className="note" key={note.id}>
                <div>
                  <strong>{note.author}</strong>
                  <time dateTime={note.createdAt}>
                    {new Date(note.createdAt).toLocaleString()}
                  </time>
                </div>
                <p>{note.body}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="detail-card activity-section">
        <h2>Activity Log</h2>
        <ul className="activity-list">
          {ticket.activityLog.map((act) => (
            <li key={act.id}>
              <strong>{act.user}</strong> {act.action}{" "}
              <span className="activity-time">
                (
                {new Date(act.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                )
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default TicketDetail;