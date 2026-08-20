import data from '../data/tickets.json';

function rebase(iso, shiftMs) {
  return iso === null
    ? null
    : new Date(new Date(iso).getTime() + shiftMs).toISOString();
}

export function getTickets() {
  const shiftMs =
    Date.now() - new Date(data.generatedAt).getTime();

  const tickets = data.tickets.map((ticket) => ({
    ...ticket,
    createdAt: rebase(ticket.createdAt, shiftMs),
    resolvedAt: rebase(ticket.resolvedAt, shiftMs),
    notes: ticket.notes.map((note) => ({
      ...note,
      createdAt: rebase(note.createdAt, shiftMs),
    })),
  }));

  return new Promise((resolve) => {
    setTimeout(() => resolve(tickets), 600);
  });
}

export function getTeam() {
  return data.team;
}