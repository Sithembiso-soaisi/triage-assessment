import { describe, expect, test } from 'vitest';
import { msRemaining, slaStatus, formatRemaining } from './sla';

describe('SLA rules', () => {
  test('P1 ticket with 40 minutes remaining is ok', () => {
    const ticket = {
      priority: 'P1',
      status: 'open',
      createdAt: '2026-08-18T10:00:00.000Z',
      resolvedAt: null,
    };

    const now = new Date('2026-08-18T10:20:00.000Z').getTime();

    expect(slaStatus(ticket, now)).toBe('ok');
    expect(msRemaining(ticket, now)).toBe(40 * 60 * 1000);
  });

  test('P1 ticket with 10 minutes remaining is at-risk', () => {
    const ticket = {
      priority: 'P1',
      status: 'open',
      createdAt: '2026-08-18T10:00:00.000Z',
      resolvedAt: null,
    };

    const now = new Date('2026-08-18T10:50:00.000Z').getTime();

    expect(slaStatus(ticket, now)).toBe('at-risk');
  });

  test('P1 ticket past its deadline is breached', () => {
    const ticket = {
      priority: 'P1',
      status: 'open',
      createdAt: '2026-08-18T10:00:00.000Z',
      resolvedAt: null,
    };

    const now = new Date('2026-08-18T11:30:00.000Z').getTime();

    expect(slaStatus(ticket, now)).toBe('breached');
  });

  test('P2 ticket resolved before its deadline is met', () => {
    const ticket = {
      priority: 'P2',
      status: 'resolved',
      createdAt: '2026-08-18T10:00:00.000Z',
      resolvedAt: '2026-08-18T12:00:00.000Z',
    };

    const now = new Date('2026-08-18T23:00:00.000Z').getTime();

    expect(slaStatus(ticket, now)).toBe('met');
  });

  test('P2 ticket resolved after its deadline remains breached', () => {
    const ticket = {
      priority: 'P2',
      status: 'resolved',
      createdAt: '2026-08-18T10:00:00.000Z',
      resolvedAt: '2026-08-18T18:00:00.000Z',
    };

    const now = new Date('2026-08-18T23:00:00.000Z').getTime();

    expect(slaStatus(ticket, now)).toBe('breached');
  });

  test('formatRemaining formats time correctly', () => {
    expect(formatRemaining(2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000))
      .toBe('2d 6h left');

    expect(formatRemaining(11 * 60 * 1000))
      .toBe('11m left');

    expect(formatRemaining(-(22 * 60 * 1000)))
      .toBe('Breached 22m ago');
  });
});