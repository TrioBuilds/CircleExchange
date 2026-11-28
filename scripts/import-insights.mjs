const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !['--apply', '--emulator'].includes(arg))) {
  throw new Error('Usage: node scripts/import-insights.mjs [--apply] [--emulator]');
}
const emulator = args.has('--emulator');
const project = emulator ? 'demo-circleexchange' : 'circle-exchange';
const firestore = emulator ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com';
const auth = emulator
  ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com'
  : 'https://identitytoolkit.googleapis.com';
const token = emulator ? 'owner' : process.env.CIRCLEEXCHANGE_ADMIN_ACCESS_TOKEN;
if (!token?.trim())
  throw new Error(
    'Set CIRCLEEXCHANGE_ADMIN_ACCESS_TOKEN to a short-lived Google Cloud access token.',
  );
const root = 'projects/' + project + '/databases/(default)/documents';
const docs = firestore + '/v1/' + root;
const maxRecords = 10_000;

async function call(url, body) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok)
    throw new Error(
      'Google API request failed (HTTP ' + response.status + '). Check project access and retry.',
    );
  return response.json();
}

async function records(collectionId, fields, allDescendants = false) {
  const data = await call(docs + ':runQuery', {
    structuredQuery: {
      select: { fields: fields.map((fieldPath) => ({ fieldPath })) },
      from: [{ collectionId, allDescendants }],
      limit: maxRecords,
    },
  });
  const result = data.flatMap((item) => (item.document ? [item.document] : []));
  if (result.length >= maxRecords)
    throw new Error('Historical source exceeds the bounded pilot import.');
  return result.map((item) => ({
    path: item.name.slice(item.name.indexOf('/documents/') + '/documents/'.length).split('/'),
    data: item.fields ?? {},
  }));
}

async function users() {
  const accounts = [];
  let nextPage = '';
  do {
    const params = new URLSearchParams({
      maxResults: '1000',
      fields: 'users(localId,email,emailVerified,createdAt,disabled),nextPageToken',
    });
    if (nextPage) params.set('nextPageToken', nextPage);
    const page = await call(auth + '/v1/projects/' + project + '/accounts:batchGet?' + params);
    accounts.push(...(page.users ?? []));
    if (accounts.length >= maxRecords)
      throw new Error('Authentication exceeds the bounded pilot import.');
    nextPage = page.nextPageToken ?? '';
  } while (nextPage);
  return accounts;
}

const string = (stringValue) => ({ stringValue });
const bool = (booleanValue) => ({ booleanValue });
const time = (timestampValue) => (timestampValue ? { timestampValue } : { nullValue: null });
const value = (row, field) => row[field]?.stringValue;
const stamp = (row, field) => row[field]?.timestampValue;
const writes = new Map();

function create(name, fields) {
  writes.set(name, {
    update: { name: root + '/' + name, fields },
    currentDocument: { exists: false },
  });
}

function event(kind, uid, circle = '', post = '', at) {
  const suffix =
    kind === 'signup' || kind === 'verified'
      ? [uid]
      : kind === 'join'
        ? [circle, uid]
        : [circle, post, ...(kind === 'reply' ? [uid] : [])];
  create('insightEvents/' + [kind, ...suffix].join('~'), {
    kind: string(kind),
    uid: string(uid),
    circle: string(circle),
    post: string(post),
    at: time(at),
  });
}

const [accounts, locality, members, listings, replies, reports] = await Promise.all([
  users(),
  records('localityMemberships', ['areaId']),
  records('members', ['status', 'createdAt'], true),
  records('listings', ['ownerId', 'createdAt', 'status', 'askDeadline'], true),
  records('requests', ['createdAt', 'status'], true),
  records('feedback', ['reporterUid', 'email', 'category', 'status', 'createdAt', 'resolvedAt']),
]);
for (const account of accounts) {
  if (!account.email || account.disabled || !account.localId || !Number(account.createdAt))
    continue;
  event('signup', account.localId, '', '', new Date(Number(account.createdAt)).toISOString());
  if (account.emailVerified) event('verified', account.localId);
}
for (const { path, data } of locality) {
  const area = value(data, 'areaId');
  if (area) event('join', path[1], area);
}
for (const { path, data } of members) {
  if (
    path.length !== 4 ||
    path[0] !== 'communities' ||
    path[2] !== 'members' ||
    value(data, 'status') !== 'active'
  )
    continue;
  event('join', path[3], path[1], '', stamp(data, 'createdAt'));
}
const owners = new Map();
const confirmed = new Set(
  (await records('private', ['confirmedAt'], true))
    .filter(
      ({ path, data }) =>
        path.length === 6 &&
        path[0] === 'communities' &&
        path[2] === 'listings' &&
        path[5] === 'outcome' &&
        stamp(data, 'confirmedAt'),
    )
    .map(({ path }) => path[1] + '~' + path[3]),
);
for (const { path, data } of listings) {
  if (path.length !== 4 || path[0] !== 'communities' || path[2] !== 'listings') continue;
  const [, circle, , post] = path;
  const uid = value(data, 'ownerId');
  if (!uid) continue;
  const key = circle + '~' + post;
  owners.set(key, uid);
  event(stamp(data, 'askDeadline') ? 'ask' : 'offer', uid, circle, post, stamp(data, 'createdAt'));
  if (value(data, 'status') === 'exchanged' && !confirmed.has(key))
    event('closed', uid, circle, post);
}
for (const { path, data } of replies) {
  if (
    path.length !== 6 ||
    path[0] !== 'communities' ||
    path[2] !== 'listings' ||
    path[4] !== 'requests'
  )
    continue;
  const [, circle, , post, , uid] = path;
  const owner = owners.get(circle + '~' + post);
  if (!owner) continue;
  event('reply', uid, circle, post, stamp(data, 'createdAt'));
  if (value(data, 'status') === 'accepted') event('match', owner, circle, post);
}
for (const { path, data } of reports) {
  const uid = value(data, 'reporterUid');
  const category = value(data, 'category');
  const status = value(data, 'status');
  const createdAt = stamp(data, 'createdAt');
  if (!uid || !category || !status || !createdAt) continue;
  create('insightReports/' + path[1], {
    uid: string(uid),
    guest: bool(!value(data, 'email')),
    category: string(category),
    status: string(status),
    createdAt: time(createdAt),
    resolvedAt: time(stamp(data, 'resolvedAt')),
  });
}

const pending = [...writes.values()];
if (!args.has('--apply')) {
  console.log(
    'Dry run for %s. Prepared %d metric records. No data written.',
    project,
    pending.length,
  );
} else {
  let added = 0;
  let existing = 0;
  for (let start = 0; start < pending.length; start += 200) {
    const batch = pending.slice(start, start + 200);
    const result = await call(docs + ':batchWrite', { writes: batch });
    if (result.status?.length !== batch.length)
      throw new Error('Firestore returned an incomplete batch result.');
    for (const status of result.status) {
      if (!status.code) added++;
      else if (status.code === 6) existing++;
      else
        throw new Error(
          'Firestore rejected a metric record (code ' +
            status.code +
            '). The import can be safely retried.',
        );
    }
  }
  await call(docs + ':commit', {
    writes: [
      {
        update: { name: root + '/insightCoverage/current', fields: {} },
        updateTransforms: [{ fieldPath: 'importedAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ],
  });
  console.log(
    'Imported %d metric records into %s. Preserved %d existing records.',
    added,
    project,
    existing,
  );
}
