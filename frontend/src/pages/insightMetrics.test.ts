import { Timestamp } from 'firebase/firestore';
import { expect, it } from 'vitest';
import { insightMetrics } from './insightMetrics';
import type { InsightEvent } from '../services/insightEvents';

const now = Date.parse('2026-11-28T06:00:00Z');
const recent = Timestamp.fromMillis(now - 60_000);
const old = Timestamp.fromMillis(now - 35 * 86_400_000);
const baner = 'local:pune:baner';
const apartment = baner + ':alacrity';

function event(
  kind: InsightEvent['kind'],
  uid: string,
  circle = '',
  post = '',
  at: Timestamp | null = recent,
): InsightEvent {
  return { kind, uid, circle, post, at };
}

it('deduplicates reply and location rollups and reports unknown completion dates only in all activity', () => {
  const data = {
    reports: [],
    events: [
      event('join', 'a', baner),
      event('join', 'a', apartment),
      event('offer', 'a', apartment, 'x'),
      event('reply', 'b', apartment, 'x'),
      event('reply', 'c', apartment, 'x'),
      event('offer', 'd', 'hp', 'x'),
      event('closed', 'a', apartment, 'x', null),
      event('confirmed', 'b', apartment, 'x'),
    ],
  };
  const today = insightMetrics(data, 30, baner, now);
  expect(today.selected).toMatchObject({
    joins: 1,
    offers: 1,
    replied: 1,
    confirmed: 1,
    marked: 0,
  });
  expect(today.rows.find((row) => row.id === baner)?.offers).toBe(0);
  expect(today.undated).toBe(1);
  expect(insightMetrics(data, 0, baner, now).selected.marked).toBe(1);
});

it('keeps onboarding cohort size and report resolution time independent of the circle filter', () => {
  const result = insightMetrics(
    {
      events: [
        event('signup', 'a'),
        event('signup', 'old', '', '', old),
        event('join', 'a', baner),
        event('reply', 'a', baner, 'x'),
        event('verified', 'old'),
      ],
      reports: [
        {
          uid: 'a',
          category: 'bug',
          guest: false,
          status: 'new',
          createdAt: recent,
          resolvedAt: null,
        },
        {
          uid: 'a',
          category: 'bug',
          guest: false,
          status: 'new',
          createdAt: recent,
          resolvedAt: null,
        },
        {
          uid: 'guest',
          category: 'bug',
          guest: true,
          status: 'closed',
          createdAt: old,
          resolvedAt: recent,
        },
      ],
    },
    7,
    'hp',
    now,
  );
  expect(result.onboarding).toEqual({ signups: 1, verified: 1, joined: 1, activated: 1 });
  expect(result.feedback).toMatchObject({
    issues: 2,
    accounts: 1,
    guests: 0,
    open: 2,
    resolved: 1,
  });
  expect(result.selected.replied).toBe(0);
});
