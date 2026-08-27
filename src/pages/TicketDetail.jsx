import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { getTickets, saveTicketUpdate } from "../lib/api";
import { slaStatus, formatRemaining, msRemaining } from "../lib/sla";
import "./TicketDetail.css";

const REQUESTER_DATA = {
  "Ngozi Eze": { email: "ngozi.eze@example.com", phone: "+234 801 234 5678" },
  "Tunde Bello": { email: "tunde.bello@example.com", phone: "+234 802 345 6789" },
  "Ada Nwosu": { email: "ada.nwosu@example.com", phone: "+234 803 456 7890" },
  "Bode Adekunle": { email: "bode.adekunle@example.com", phone: "+234 804 567 8901" },
  "Samuel Otieno": { email: "samuel.otieno@example.com", phone: "+254 712 345 678" },
  "Ife Adeyemi": { email: "ife.adeyemi@example.com", phone: "+234 805 678 9012" },
  "Chidi Okafor": { email: "chidi.okafor@example.com", phone: "+234 806 789 0123" },
  "Grace Mensah": { email: "grace.mensah@example.com", phone: "+233 244 123 456" },
  "Fatima Bala": { email: "fatima.bala@example.com", phone: "+234 807 890 1234" },
  "Emeka Obi": { email: "emeka.obi@example.com", phone: "+234 808 901 2345" },
  "Halima Sule": { email: "halima.sule@example.com", phone: "+234 809 012 3456" },
  "Lerato Dlamini": { email: "lerato.dlamini@example.com", phone: "+27 72 345 6789" },
  "Yaw Asante": { email: "yaw.asante@example.com", phone: "+233 244 789 012" },
  "Zainab Yusuf": { email: "zainab.yusuf@example.com", phone: "+234 810 123 4567" },
  "Kwame Boateng": { email: "kwame.boateng@example.com", phone: "+233 244 456 789" },
};

const RELATED_TICKETS = {
  "TCK-1001": ["TCK-1037"],
  "TCK-1005": ["TCK-1012"],
  "TCK-1008": ["TCK-1028"],
  "TCK-1010": ["TCK-1034"],
};

function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      const tickets = await getTickets();
      setAllTickets(tickets);
      setTicket(tickets.find((item) => item.id === id));
      setLoading(false);
    }
    loadTicket();
  }, [id]);

  const updateTicket = (updatedTicket) => {
    setTicket(updatedTicket);
    saveTicketUpdate(updatedTicket);
  };

  const handleStatusChange = (event) => {
    const status = event.target.value;
    updateTicket({ ...ticket, status, resolvedAt: status === "resolved" ? new Date().toISOString() : null });
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body) {
      setNoteError("Enter a note before saving.");
      return;
    }
    updateTicket({
      ...ticket,
      notes: [...ticket.notes, { id: `note-${Date.now()}`, author: "Support team", body, createdAt: new Date().toISOString() }],
    });
    setNoteBody("");
    setNoteError("");
  };

  const slaInfo = useMemo(() => {
    if (!ticket) return { status: "ok", formatted: "N/A", remaining: 0 };
    const status = slaStatus(ticket, 0);
    const remaining = msRemaining(ticket, 0);
    const formatted = formatRemaining(remaining);
    return { status, formatted, remaining };
  }, [ticket]);

  const requesterInfo = ticket ? REQUESTER_DATA[ticket.requester] : null;
  const relatedTicketIds = ticket ? RELATED_TICKETS[ticket.id] || [] : [];
  const relatedTicketObjects = allTickets.filter(t => relatedTicketIds.includes(t.id));

  const activityLog = ticket ? [
    { id: 1, action: "created", user: ticket.requester, time: ticket.createdAt },
    ...(ticket.notes || []).map((note, idx) => ({
      id: idx + 2,
      action: "note",
      user: note.author,
      body: note.body,
      time: note.createdAt
    })),
    ...(ticket.status !== "open" ? [{
      id: 100,
      action: "status",
      user: ticket.assignee || "System",
      detail: ticket.status,
      time: ticket.resolvedAt || ticket.createdAt
    }] : [])
  ] : [];

  if (loading) return <p className="ticket-detail-state">Loading ticket...</p>;
  if (!ticket) return <p className="ticket-detail-state">Ticket not found.</p>;

  return (
    <main className="ticket-detail">
      <Link className="back-link" to="/tickets">← Back to board</Link>
      <header className="ticket-detail__header">
        <div><p className="ticket-detail__id">{ticket.id}</p><h1>{ticket.subject}</h1></div>
        <div className="ticket-detail__badges">
          <span className={`detail-badge priority-${ticket.priority}`}>{ticket.priority}</span>
          <span className={`detail-badge status-${ticket.status}`}>{ticket.status.replace("-", " ")}</span>
        </div>
      </header>

      <section className="ticket-detail__grid">
        <div className="detail-column">
          <article className="detail-card detail-card--description">
            <h2>Description</h2>
            <p>{ticket.description}</p>
          </article>
          
          {ticket.stepsToReproduce && (
            <article className="detail-card">
              <h2>Steps to Reproduce</h2>
              <ol className="steps-list">
                {ticket.stepsToReproduce.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </article>
          )}

          <article className="detail-card">
            <h2>Attachments</h2>
            <div className="attachments-list">
              <div className="attachment-item empty">
                <span className="attachment-icon">📎</span>
                <span>No attachments</span>
              </div>
            </div>
          </article>

          <article className="detail-card">
            <h2>Activity Log</h2>
            <div className="activity-log">
              {activityLog.map((entry) => (
                <div key={entry.id} className="activity-item">
                  <span className="activity-time">
                    {entry.time === ticket.createdAt 
                      ? `Created ${new Date(entry.time).toLocaleString()}`
                      : `${new Date(entry.time).toLocaleString()}`}
                  </span>
                  <span className="activity-user">{entry.user}</span>
                  {entry.action === "created" && <span className="activity-action">created this ticket</span>}
                  {entry.action === "note" && <span className="activity-action">added a note</span>}
                  {entry.action === "status" && <span className="activity-action">changed status to {entry.detail}</span>}
                </div>
              ))}
            </div>
          </article>

          {relatedTicketObjects.length > 0 && (
            <article className="detail-card">
              <h2>Related Tickets</h2>
              <div className="related-tickets">
                {relatedTicketObjects.map(t => (
                  <Link key={t.id} to={`/tickets/${t.id}`} className="related-ticket">
                    <span className="related-id">{t.id}</span>
                    <span className="related-subject">{t.subject}</span>
                  </Link>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="sidebar">
          <div className="detail-card">
            <h2>Requester Info</h2>
            <dl className="ticket-meta">
              <div><dt>Name</dt><dd>{ticket.requester}</dd></div>
              {requesterInfo && (
                <>
                  <div><dt>Email</dt><dd>{requesterInfo.email}</dd></div>
                  <div><dt>Phone</dt><dd>{requesterInfo.phone}</dd></div>
                </>
              )}
            </dl>
          </div>

          <div className="detail-card">
            <h2>SLA Timer</h2>
            <div className={`sla-timer ${slaInfo.status}`}>
              {slaInfo.status === "breached" && <span className="sla-icon">⚠️</span>}
              {slaInfo.status === "at-risk" && <span className="sla-icon">⚡</span>}
              <span className="sla-timer-text">
                {slaInfo.status === "breached" 
                  ? `Breached ${slaInfo.formatted}`
                  : `${slaInfo.formatted} left`}
              </span>
            </div>
          </div>

          <div className="detail-card">
            <dl className="ticket-meta">
              <div><dt>Assignee</dt><dd>{ticket.assignee ?? "Unassigned"}</dd></div>
              <div><dt>Created</dt><dd>{new Date(ticket.createdAt).toLocaleString()}</dd></div>
              {ticket.resolvedAt && <div><dt>Resolved</dt><dd>{new Date(ticket.resolvedAt).toLocaleString()}</dd></div>}
            </dl>
            <label className="status-field" htmlFor="status">Status
              <select id="status" value={ticket.status} onChange={handleStatusChange}>
                <option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option>
              </select>
            </label>
          </div>
        </aside>
      </section>

      <section className="detail-card notes-section" aria-labelledby="notes-heading">
        <div className="section-heading"><h2 id="notes-heading">Notes</h2><p>{ticket.notes.length} note{ticket.notes.length === 1 ? "" : "s"}</p></div>
        <form className="note-form" onSubmit={handleAddNote} noValidate>
          <label htmlFor="note">Add an internal note</label>
          <textarea id="note" value={noteBody} onChange={(event) => { setNoteBody(event.target.value); setNoteError(""); }} placeholder="Write an update for the support team…" aria-describedby={noteError ? "note-error" : undefined} />
          {noteError && <p className="form-error" id="note-error" role="alert">{noteError}</p>}
          <button type="submit">Add note</button>
        </form>
        <div className="notes-list">
          {ticket.notes.length === 0 ? <p className="empty-notes">No notes yet. Add the first update above.</p> : ticket.notes.map((note) => (
            <article className="note" key={note.id}><div><strong>{note.author}</strong><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time></div><p>{note.body}</p></article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default TicketDetail;