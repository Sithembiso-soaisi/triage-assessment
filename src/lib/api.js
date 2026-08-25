import data from '../data/tickets.json';

export const TICKET_UPDATES_KEY = 'triage-ticket-updates';

function rebase(iso, shiftMs) {
  return iso === null ? null : new Date(new Date(iso).getTime() + shiftMs).toISOString();
}

function readTicketUpdates() {
  try {
    return JSON.parse(localStorage.getItem(TICKET_UPDATES_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function getTickets() {
  const shiftMs = Date.now() - new Date(data.generatedAt).getTime();
  const savedUpdates = readTicketUpdates();
  const tickets = data.tickets.map((ticket) => ({
    ...ticket,
    createdAt: rebase(ticket.createdAt, shiftMs),
    resolvedAt: rebase(ticket.resolvedAt, shiftMs),
    notes: ticket.notes.map((note) => ({ ...note, createdAt: rebase(note.createdAt, shiftMs) })),
    ...savedUpdates[ticket.id],
  }));
  return new Promise((resolve) => setTimeout(() => resolve(tickets), 600));
}

export function saveTicketUpdate(ticket) {
  const updates = readTicketUpdates();
  updates[ticket.id] = { status: ticket.status, resolvedAt: ticket.resolvedAt, notes: ticket.notes };
  localStorage.setItem(TICKET_UPDATES_KEY, JSON.stringify(updates));
}

export function getTeam() {
  return data.team;
}
