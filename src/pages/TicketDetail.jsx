import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTickets, saveTicketUpdate } from "../lib/api";
import "./TicketDetail.css";

function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      const tickets = await getTickets();
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
        <article className="detail-card detail-card--description"><h2>Description</h2><p>{ticket.description}</p></article>
        <aside className="detail-card">
          <dl className="ticket-meta">
            <div><dt>Requester</dt><dd>{ticket.requester}</dd></div>
            <div><dt>Assignee</dt><dd>{ticket.assignee ?? "Unassigned"}</dd></div>
            <div><dt>Created</dt><dd>{new Date(ticket.createdAt).toLocaleString()}</dd></div>
          </dl>
          <label className="status-field" htmlFor="status">Status
            <select id="status" value={ticket.status} onChange={handleStatusChange}>
              <option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option>
            </select>
          </label>
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
