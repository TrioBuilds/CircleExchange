import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { FounderFeedback } from './FeedbackPage';
import { canManageFeedback } from '../services/feedback';
import { canViewInsights, loadInsights, type Insights } from '../services/insights';
import { circleName, insightMetrics } from './insightMetrics';
import '../admin.css';

export type AdminPath = '/admin' | '/admin/feedback' | '/admin/overview';

export default function AdminArea({ user, path }: { user: User; path: AdminPath }) {
  const [access, setAccess] = useState<{ feedback: boolean; insights: boolean }>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.all([canManageFeedback(user), canViewInsights(user)])
      .then(([feedback, insights]) => {
        if (active) setAccess({ feedback, insights });
      })
      .catch(() => {
        if (active) setError('Could not check admin access. Refresh to try again.');
      });
    return () => {
      active = false;
    };
  }, [user]);

  const tools = [
    {
      allowed: access?.insights,
      href: '/admin/overview',
      title: 'Insights',
      text: 'Watch onboarding, publishing, and exchanges across your circles.',
    },
    {
      allowed: access?.feedback,
      href: '/admin/feedback',
      title: 'Feedback inbox',
      text: 'Read reports, reply to members and guests, and track fixes.',
    },
  ].filter((item) => item.allowed);
  return (
    <div className="admin-area">
      <header className="admin-header">
        <a className="brand" href="/admin">
          CircleExchange Admin
        </a>
        <a href="/feed">Back to CircleExchange</a>
      </header>
      <main className="content">
        {!access && !error && <p role="status">Checking admin access…</p>}
        {error && <p role="alert">{error}</p>}
        {access &&
          (tools.length === 0 ? (
            <section className="card narrow">
              <h1>Admin access required</h1>
              <p>This area is available to approved CircleExchange administrators.</p>
            </section>
          ) : (
            <>
              <nav className="admin-nav" aria-label="Admin tools">
                <a href="/admin" aria-current={path === '/admin' ? 'page' : undefined}>
                  Admin home
                </a>
                {tools.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={path === item.href ? 'page' : undefined}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
              {path === '/admin' ? (
                <>
                  <h1>Admin workspace</h1>
                  <div className="admin-tools">
                    {tools.map((item) => (
                      <a key={item.href} className="card admin-tool" href={item.href}>
                        <h2>{item.title}</h2>
                        <p>{item.text}</p>
                      </a>
                    ))}
                  </div>
                </>
              ) : path === '/admin/feedback' && access.feedback ? (
                <FounderFeedback user={user} />
              ) : path === '/admin/overview' && access.insights ? (
                <Overview />
              ) : (
                <p>This tool requires its own admin permission.</p>
              )}
            </>
          ))}
      </main>
    </div>
  );
}

const counts = new Intl.NumberFormat('en-IN');
const indiaDate = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dimensions = [
  ['joins', 'Members joined'],
  ['offers', 'Offers'],
  ['asks', 'Asks'],
  ['replied', 'Posts with replies'],
  ['matches', 'Matches accepted'],
  ['marked', 'Owner marked exchanged'],
  ['confirmed', 'Both confirmed'],
] as const;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <dt>{label}</dt>
      <dd>{counts.format(value)}</dd>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<{ insights: Insights; updated: number }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [circle, setCircle] = useState('');
  const [sort, setSort] = useState<(typeof dimensions)[number][0]>('confirmed');

  useEffect(() => {
    let active = true;
    void loadInsights()
      .then((insights) => {
        if (active) setData({ insights, updated: Date.now() });
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error && !('code' in err)
              ? err.message
              : 'Could not load insights. Try refreshing.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      setData({ insights: await loadInsights(), updated: Date.now() });
    } catch (err) {
      setError(
        err instanceof Error && !('code' in err) ? err.message : 'Could not refresh insights.',
      );
    } finally {
      setBusy(false);
    }
  }

  const result = data && insightMetrics(data.insights, days, circle, data.updated);
  const maxConfirmed = Math.max(1, ...(result?.confirmedDays.map((entry) => entry[1]) ?? []));
  const names = [...(result?.circleIds ?? [])].sort((a, b) =>
    circleName(a).localeCompare(circleName(b)),
  );
  const rows = result?.rows.sort(
    (a, b) => b[sort] - a[sort] || circleName(a.id).localeCompare(circleName(b.id)),
  );

  return (
    <div className="admin-overview">
      <div className="admin-title">
        <div>
          <h1>Insights</h1>
          <p className="muted">Onboarding, feedback, and activity across your circles.</p>
        </div>
        <button
          className="secondary"
          type="button"
          disabled={busy || (!data && !error)}
          onClick={() => void refresh()}
        >
          {busy ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {!result && !error && <p role="status">Loading insights…</p>}
      {data && result && (
        <>
          <div className="admin-filters">
            <label>
              Date range
              <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={0}>All recorded activity</option>
              </select>
            </label>
            <label>
              Publishing circle
              <select value={circle} onChange={(event) => setCircle(event.target.value)}>
                <option value="">All circles</option>
                {names.map((id) => (
                  <option key={id} value={id}>
                    {circleName(id)}
                  </option>
                ))}
              </select>
            </label>
            <small>Updated {indiaDate.format(data.updated)} · Dates in IST</small>
          </div>
          {!data.insights.importedAt && (
            <p className="notice">
              Historical baseline hasn’t been imported. Counts reflect activity recorded by this
              version of CircleExchange.
            </p>
          )}
          <div className="admin-summary">
            <section className="card" aria-labelledby="insight-onboarding">
              <h2 id="insight-onboarding">Onboarding</h2>
              <p className="muted">
                Milestones reached by accounts created in the selected period, across all circles.
              </p>
              <dl className="admin-stats">
                <Stat label="Accounts created" value={result.onboarding.signups} />
                <Stat label="Email verified" value={result.onboarding.verified} />
                <Stat label="Joined a circle" value={result.onboarding.joined} />
                <Stat label="Posted or replied" value={result.onboarding.activated} />
              </dl>
            </section>
            <section className="card" aria-labelledby="insight-feedback">
              <h2 id="insight-feedback">Feedback</h2>
              <p className="muted">
                Across all circles. Guest reporters are counted by anonymous session.
              </p>
              <dl className="admin-stats">
                <Stat label="Issues reported" value={result.feedback.issues} />
                <Stat label="Member reporters" value={result.feedback.accounts} />
                <Stat label="Guest reporters" value={result.feedback.guests} />
                <Stat label="Open issues now" value={result.feedback.open} />
                <Stat label="Issues resolved in period" value={result.feedback.resolved} />
                <Stat label="Ideas" value={result.feedback.ideas} />
                <Stat label="Experience reports" value={result.feedback.experiences} />
              </dl>
            </section>
          </div>
          <section className="card" aria-labelledby="insight-circles">
            <div className="admin-title">
              <div>
                <h2 id="insight-circles">Circle activity</h2>
                <p className="muted">
                  {circle ? circleName(circle) + ' and any child circles' : 'All circles'}
                </p>
              </div>
              <label>
                Sort circles by
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                >
                  {dimensions.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <dl className="admin-stats">
              <Stat label="Supported local areas" value={result.locations.supported} />
              <Stat label="Local areas with recorded members" value={result.locations.populated} />
              <Stat label="Local areas with activity" value={result.locations.active} />
              <Stat label="Exchanges confirmed by both" value={result.selected.confirmed} />
            </dl>
            {result.undated > 0 && days > 0 && (
              <p className="muted">
                Some older joins, matches, and closures have no timestamp. They appear in all
                recorded activity.
              </p>
            )}
            <div
              className="admin-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Circle activity table"
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Circle</th>
                    {dimensions.map(([key, label]) => (
                      <th key={key} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows?.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => setCircle(row.id)}
                        >
                          {circleName(row.id)}
                        </button>
                      </th>
                      {dimensions.map(([key]) => (
                        <td key={key}>{counts.format(row[key])}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Selected circles</th>
                    {dimensions.map(([key]) => (
                      <td key={key}>{counts.format(result.selected[key])}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="muted">
              <small>
                Each post belongs to its publishing circle. Posts with replies are computed for
                posts published in the selected period. An owner-marked exchange can also be
                confirmed by both members.
              </small>
            </p>
          </section>
          <section className="card" aria-labelledby="insight-outcomes">
            <h2 id="insight-outcomes">Confirmed exchanges over time</h2>
            {!result.confirmedDays.length ? (
              <p>No exchanges were confirmed by both members in this selection.</p>
            ) : (
              <ul className="admin-timeline">
                {result.confirmedDays.map(([day, total]) => (
                  <li key={day}>
                    <span>{indiaDate.format(day)}</span>
                    <meter
                      aria-label={'Confirmed exchanges on ' + indiaDate.format(day)}
                      min={0}
                      max={maxConfirmed}
                      value={total}
                    />
                    <strong>{counts.format(total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
