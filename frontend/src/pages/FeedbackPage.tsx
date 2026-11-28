import { useEffect, useState, type FormEvent } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { FeedbackImage } from '../components/FeedbackComposer';
import Notice from '../components/Notice';
import {
  canManageFeedback,
  categories,
  listFeedback,
  loadFeedbackDetail,
  removeFeedbackImage,
  saveFeedbackTriage,
  sendFeedbackReply,
  statuses,
  type Report,
  type ReportCursor,
  type Status,
} from '../services/feedback';

const githubIssues = 'https://github.com/TrioBuilds/CircleExchange/issues';

export function FounderFeedback({ user }: { user: User }) {
  const [allowed, setAllowed] = useState<boolean>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void canManageFeedback(user)
      .then((result) => {
        if (active) setAllowed(result);
      })
      .catch(() => {
        if (active) setError('Could not check inbox access. Refresh to try again.');
      });
    return () => {
      active = false;
    };
  }, [user]);
  if (allowed) return <FeedbackPage user={user} admin />;
  return (
    <section className="card narrow">
      <h1>Feedback inbox</h1>
      <Notice error={error} message="" />
      {allowed === undefined && !error && <p role="status">Checking access…</p>}
      {allowed === false && <p>This inbox is available to the CircleExchange feedback team.</p>}
    </section>
  );
}

export default function FeedbackPage({
  user,
  admin = false,
}: {
  user: User | null;
  admin?: boolean;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [cursor, setCursor] = useState<ReportCursor>();
  const [busy, setBusy] = useState(!!user);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [refresh, setRefresh] = useState(0);
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    let active = true;
    void listFeedback(uid, admin)
      .then(({ reports, next }) => {
        if (!active) return;
        setReports(reports);
        setCursor(next);
      })
      .catch(() => {
        if (active) setError('Could not load feedback. Try refreshing the inbox.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [uid, admin, refresh]);

  async function more() {
    if (!uid || !cursor || busy) return;
    setBusy(true);
    setError('');
    try {
      const { reports: page, next } = await listFeedback(uid, admin, cursor);
      setReports((previous) => [...previous, ...page]);
      setCursor(next);
    } catch {
      setError('Could not load more feedback. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const report = reports.find((item) => item.id === selected);
  const shown = reports.filter(
    (item) => (!status || item.status === status) && (!category || item.category === category),
  );
  return (
    <>
      <div className="feedback-heading">
        <h1>{admin ? 'Feedback inbox' : 'My feedback'}</h1>
        {uid && (
          <button
            className="secondary"
            disabled={busy || !!report}
            onClick={() => {
              setBusy(true);
              setError('');
              setRefresh((value) => value + 1);
            }}
          >
            Refresh inbox
          </button>
        )}
      </div>
      {!uid && (
        <p>
          Open this page in the browser you used to send guest feedback, or sign in to see your
          reports.
        </p>
      )}
      <Notice error={error} message="" />
      {report ? (
        <>
          <button className="secondary" onClick={() => setSelected('')}>
            Back to feedback
          </button>
          <FeedbackDetail
            key={report.id}
            report={report}
            admin={admin}
            onStatus={(next, current) =>
              setReports((previous) =>
                previous.map((item) =>
                  item.id === report.id ? { ...item, status: next, resolvedAt: current } : item,
                ),
              )
            }
          />
        </>
      ) : (
        uid && (
          <>
            {admin && (
              <div className="feedback-filters">
                <label>
                  Status{' '}
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    {statuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Category{' '}
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="">All categories</option>
                    {Object.entries(categories).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="muted">
                  {reports.filter((item) => item.status === 'new').length} new in loaded reports
                </p>
              </div>
            )}
            {!busy && !error && shown.length === 0 && (
              <p>
                {reports.length ? 'No loaded reports match these filters.' : 'No feedback yet.'}
              </p>
            )}
            <ul className="feedback-list">
              {shown.map((item) => (
                <li key={item.id}>
                  <button className="secondary" onClick={() => setSelected(item.id)}>
                    <span>
                      <strong>
                        {item.body.slice(0, 96)}
                        {item.body.length > 96 ? '…' : ''}
                      </strong>
                      <br />
                      <small>
                        {categories[item.category]} · {item.status} ·{' '}
                        {item.createdAt.toDate().toLocaleDateString()}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {busy && <p role="status">Loading feedback…</p>}
            {cursor && (
              <button className="secondary" disabled={busy} onClick={() => void more()}>
                Load more
              </button>
            )}
          </>
        )
      )}
    </>
  );
}

type Detail = Awaited<ReturnType<typeof loadFeedbackDetail>>;

function FeedbackDetail({
  report,
  admin,
  onStatus,
}: {
  report: Report;
  admin: boolean;
  onStatus: (next: Status, resolvedAt: Report['resolvedAt']) => void;
}) {
  const [detail, setDetail] = useState<Detail>();
  const [status, setStatus] = useState(report.status);
  const [issue, setIssue] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    void loadFeedbackDetail(report.id, admin)
      .then((result) => {
        if (!active) return;
        setDetail(result);
        setIssue(result.triage.issue ? String(result.triage.issue) : '');
      })
      .catch(() => {
        if (active) setError('Could not load this report. Try refreshing.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [report.id, admin, refresh]);

  function reload() {
    setBusy(true);
    setError('');
    setRefresh((value) => value + 1);
  }

  async function act(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await operation();
    } catch {
      setError('Could not save the change. Your edits are still here. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = reply.trim();
    if (!body) return;
    await act(async () => {
      const messages = await sendFeedbackReply(report.id, admin ? 'team' : 'reporter', body);
      setReply('');
      setDetail(
        (previous) =>
          previous && {
            ...previous,
            messages,
          },
      );
      setMessage('Reply sent.');
    });
  }

  const reference = report.id.slice(-8).toUpperCase();
  const issueDraft =
    githubIssues +
    '/new?' +
    new URLSearchParams({
      title: 'Feedback ' + reference + ' · ' + categories[report.category],
      body: 'Feedback reference: ' + reference + '\n\n## Summary\n\n## Steps or expected outcome\n',
    });

  return (
    <article className="card feedback-detail">
      <div className="feedback-heading">
        <h2>{categories[report.category]}</h2>
        <span>
          {report.status} · {reference}
        </span>
      </div>
      <p className="feedback-message">{report.body}</p>
      {admin && (
        <dl>
          <dt>Reported by</dt>
          <dd>{report.name || (report.email ? 'Profile name unavailable' : 'Guest')}</dd>
          {report.email && (
            <>
              <dt>Account email</dt>
              <dd>
                {report.email} ({report.verified ? 'verified' : 'unverified'})
              </dd>
            </>
          )}
          <dt>Account ID</dt>
          <dd>{report.reporterUid}</dd>
          {report.circle && (
            <>
              <dt>Circle</dt>
              <dd>{report.circle}</dd>
            </>
          )}
          <dt>Screen and release</dt>
          <dd>
            {report.screen} · {report.version}
          </dd>
          <dt>Device context</dt>
          <dd>
            {report.viewport} · {report.language} · {report.browser}
          </dd>
          <dt>Received</dt>
          <dd>{report.createdAt.toDate().toLocaleString()}</dd>
          {report.resolvedAt && (
            <>
              <dt>Resolved</dt>
              <dd>{report.resolvedAt.toDate().toLocaleString()}</dd>
            </>
          )}
        </dl>
      )}
      <Notice error={error} message={message} />
      <button className="secondary" disabled={busy} onClick={reload}>
        {busy ? 'Loading or saving…' : 'Refresh conversation'}
      </button>
      {detail && (
        <>
          {detail.images.length > 0 && (
            <div className="feedback-images">
              {detail.images.map(({ slot, blob }) => (
                <div key={slot}>
                  <FeedbackImage blob={blob} alt={'Submitted attachment ' + (Number(slot) + 1)} />
                  {admin && (
                    <button
                      className="text-button"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm('Permanently delete this attachment?')) return;
                        void act(async () => {
                          await removeFeedbackImage(report.id, slot);
                          setDetail(
                            (previous) =>
                              previous && {
                                ...previous,
                                images: previous.images.filter((image) => image.slot !== slot),
                              },
                          );
                          setMessage('Attachment deleted.');
                        });
                      }}
                    >
                      Delete attachment {Number(slot) + 1}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <section aria-label="Feedback conversation">
            <h3>Conversation</h3>
            <ol className="feedback-replies">
              {detail.messages.map((item, index) => (
                <li key={index} data-team={item.author === 'team'}>
                  <strong>
                    {item.author === 'team' ? 'CircleExchange team' : admin ? 'Reporter' : 'You'}
                  </strong>
                  <p className="feedback-message">{item.body}</p>
                </li>
              ))}
            </ol>
            {detail.messages.length < 30 ? (
              <form onSubmit={(event) => void send(event)}>
                <label htmlFor="feedback-reply">Your reply</label>
                <textarea
                  id="feedback-reply"
                  rows={3}
                  maxLength={1500}
                  required
                  value={reply}
                  disabled={busy}
                  onChange={(event) => setReply(event.target.value)}
                />
                <button className="primary" disabled={busy || !reply.trim()}>
                  Send reply
                </button>
              </form>
            ) : (
              <p>This conversation has reached its reply limit.</p>
            )}
          </section>
          {admin && (
            <section aria-label="Private triage">
              <h3>Private triage</h3>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void act(async () => {
                    await saveFeedbackTriage(report, status, {
                      ...detail.triage,
                      issue: Number(issue),
                    });
                    if (status !== report.status) {
                      const resolvedAt =
                        status === 'shipped' || status === 'closed' ? Timestamp.now() : null;
                      onStatus(status, resolvedAt);
                    }
                    setMessage('Triage saved.');
                  });
                }}
              >
                <label htmlFor="triage-status">Status</label>
                <select
                  id="triage-status"
                  value={status}
                  disabled={busy}
                  onChange={(event) => setStatus(event.target.value as Status)}
                >
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <label htmlFor="triage-priority">Priority</label>
                <select
                  id="triage-priority"
                  value={detail.triage.priority}
                  disabled={busy}
                  onChange={(event) => {
                    setDetail({
                      ...detail,
                      triage: {
                        ...detail.triage,
                        priority: event.target.value as 'normal' | 'high',
                      },
                    });
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <label htmlFor="triage-notes">Internal notes</label>
                <textarea
                  id="triage-notes"
                  rows={3}
                  maxLength={2000}
                  value={detail.triage.notes}
                  disabled={busy}
                  onChange={(event) => {
                    setDetail({
                      ...detail,
                      triage: { ...detail.triage, notes: event.target.value },
                    });
                  }}
                />
                <label htmlFor="triage-issue">GitHub issue number</label>
                <input
                  id="triage-issue"
                  type="number"
                  min={1}
                  max={999999999}
                  value={issue}
                  disabled={busy}
                  onChange={(event) => setIssue(event.target.value)}
                />
                <div className="button-row">
                  <button className="primary" disabled={busy}>
                    Save triage
                  </button>
                  {/^\d{1,9}$/.test(issue) && Number(issue) > 0 ? (
                    <a
                      className="secondary"
                      href={githubIssues + '/' + issue}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open GitHub issue
                    </a>
                  ) : (
                    <a className="secondary" href={issueDraft} target="_blank" rel="noreferrer">
                      Draft GitHub issue
                    </a>
                  )}
                </div>
              </form>
            </section>
          )}
        </>
      )}
    </article>
  );
}
