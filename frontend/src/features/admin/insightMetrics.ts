import { areas } from '../../localities';
import { COMPANIES } from '../../companies';
import type { InsightEvent } from '../../services/insightEvents';
import type { Insights } from './insights';

export const dayMs = 86_400_000;
const indiaOffset = 330 * 60_000;
export function indiaDay(now: number) {
  return Math.floor((now + indiaOffset) / dayMs) * dayMs - indiaOffset;
}

export function circleName(id: string) {
  return (
    areas.find((item) => item.id === id)?.name ??
    COMPANIES.find((item) => item.id === id)?.name ??
    id
  );
}

type Circles = ReturnType<typeof circleSummary>;
const unique = (items: string[]) => new Set(items).size;
const postKey = (e: InsightEvent) => e.circle + '~' + e.post;

function circleSummary(events: InsightEvent[], replied: Set<string>) {
  const posts = events.filter((e) => e.kind === 'offer' || e.kind === 'ask');
  return {
    joins: unique(events.filter((e) => e.kind === 'join').map((e) => e.uid)),
    offers: posts.filter((e) => e.kind === 'offer').length,
    asks: posts.filter((e) => e.kind === 'ask').length,
    replied: posts.filter((e) => replied.has(postKey(e))).length,
    matches: events.filter((e) => e.kind === 'match').length,
    marked: events.filter((e) => e.kind === 'closed').length,
    confirmed: events.filter((e) => e.kind === 'confirmed').length,
  };
}

export function insightMetrics(data: Insights, days: number, circle: string, now: number) {
  const start = days ? indiaDay(now) - (days - 1) * dayMs : 0;
  const inWindow = (at: number | undefined) =>
    at === undefined ? days === 0 : at >= start && at <= now;
  const events = data.events.filter((e) => inWindow(e.at?.toMillis()));
  const circleIds = Array.from(
    new Set([
      ...areas.map((area) => area.id),
      ...data.events.map((event) => event.circle).filter(Boolean),
    ]),
  );
  const includesCircle = (id: string) =>
    id && (!circle || id === circle || id.startsWith(circle + ':'));
  const scoped = events.filter((event) => includesCircle(event.circle));
  const replied = new Set(data.events.filter((e) => e.kind === 'reply').map(postKey));
  const rows: ({ id: string } & Circles)[] = circleIds.filter(includesCircle).map((id) => ({
    id,
    ...circleSummary(
      events.filter((event) => event.circle === id),
      replied,
    ),
  }));

  const signups = new Set(events.filter((e) => e.kind === 'signup').map((e) => e.uid));
  const distinctUsersFor = (kind: InsightEvent['kind']) =>
    new Set(data.events.filter((e) => e.kind === kind && signups.has(e.uid)).map((e) => e.uid));
  const verified = distinctUsersFor('verified');
  const joined = distinctUsersFor('join');
  for (const uid of joined) verified.add(uid);
  const activated = new Set(
    data.events
      .filter((e) => ['offer', 'ask', 'reply'].includes(e.kind) && joined.has(e.uid))
      .map((e) => e.uid),
  );

  const reports = data.reports.filter((r) => inWindow(r.createdAt.toMillis()));
  const issues = reports.filter((r) => r.category === 'bug');
  const resolved = data.reports.filter(
    (r) => r.category === 'bug' && r.resolvedAt && inWindow(r.resolvedAt.toMillis()),
  );
  const localAreas = areas.filter((area) => includesCircle(area.id));
  const withJoins = new Set(data.events.filter((e) => e.kind === 'join').map((e) => e.circle));
  const activeAreas = new Set(scoped.filter((e) => e.kind !== 'join').map((e) => e.circle));
  const confirmedDays = new Map<number, number>();
  for (const event of scoped) {
    if (event.kind !== 'confirmed' || !event.at) continue;
    const day = indiaDay(event.at.toMillis());
    confirmedDays.set(day, (confirmedDays.get(day) ?? 0) + 1);
  }

  return {
    circleIds,
    rows,
    selected: circleSummary(scoped, replied),
    locations: {
      supported: localAreas.length,
      populated: localAreas.filter((area) => withJoins.has(area.id)).length,
      active: localAreas.filter((area) => activeAreas.has(area.id)).length,
    },
    onboarding: {
      signups: signups.size,
      verified: verified.size,
      joined: joined.size,
      activated: activated.size,
    },
    feedback: {
      issues: issues.length,
      accounts: unique(issues.filter((r) => !r.guest).map((r) => r.uid)),
      guests: unique(issues.filter((r) => r.guest).map((r) => r.uid)),
      open: data.reports.filter(
        (r) => r.category === 'bug' && !['closed', 'shipped'].includes(r.status),
      ).length,
      resolved: resolved.length,
      ideas: reports.filter((r) => r.category === 'idea').length,
      experiences: reports.filter((r) => r.category === 'experience').length,
    },
    confirmedDays: [...confirmedDays].sort(([a], [b]) => a - b),
    undated: data.events.filter(
      (e) => !e.at && ['match', 'closed', 'join'].includes(e.kind) && includesCircle(e.circle),
    ).length,
  };
}
