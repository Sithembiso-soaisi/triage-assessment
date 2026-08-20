export const SLA_HOURS = {
  P1: 1,
  P2: 4,
  P3: 24,
  P4: 72,
};

// Returns milliseconds remaining before the ticket breaches.
// Negative means the ticket has already breached.
export function msRemaining(ticket, now) {
  const createdAt = new Date(ticket.createdAt).getTime();
  const slaMilliseconds = SLA_HOURS[ticket.priority] * 60 * 60 * 1000;
  const deadline = createdAt + slaMilliseconds;

  // Resolved tickets stop their clock at resolvedAt.
  const endTime = ticket.resolvedAt
    ? new Date(ticket.resolvedAt).getTime()
    : now;

  return deadline - endTime;
}

// Returns:
// 'met' | 'ok' | 'at-risk' | 'breached'
export function slaStatus(ticket, now) {
  const remaining = msRemaining(ticket, now);

  // Resolved before the deadline.
  if (ticket.status === 'resolved') {
    return remaining >= 0 ? 'met' : 'breached';
  }

  // Open/in-progress ticket that has passed its deadline.
  if (remaining < 0) {
    return 'breached';
  }

  const slaMilliseconds =
    SLA_HOURS[ticket.priority] * 60 * 60 * 1000;

  // At risk when less than 25% of the original SLA remains.
  if (remaining < slaMilliseconds * 0.25) {
    return 'at-risk';
  }

  return 'ok';
}

// Converts milliseconds into a human-readable string.
export function formatRemaining(ms) {
  if (ms < 0) {
    const elapsed = Math.abs(ms);

    const totalMinutes = Math.floor(elapsed / (60 * 1000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `Breached ${days}d ${hours}h ago`;
    }

    if (hours > 0) {
      return `Breached ${hours}h ${minutes}m ago`;
    }

    return `Breached ${minutes}m ago`;
  }

  const totalMinutes = Math.floor(ms / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}