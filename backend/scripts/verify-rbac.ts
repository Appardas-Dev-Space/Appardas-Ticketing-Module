/**
 * Automated RBAC verification.
 *
 * Authenticates as each seeded demo user against a RUNNING Strapi instance and
 * asserts the security invariants from IMPLEMENTATION_PLAN §3 / §11
 * (role gating, row + field-level ticket auth, anti-escalation on member mgmt).
 *
 * Prereqs:
 *   1. Strapi running at BASE (default http://127.0.0.1:1337).
 *   2. `npm run seed` has been run (creates the demo users below).
 *
 * Run:  npm run test:rbac   (from backend/)
 */

const BASE = process.env.STRAPI_URL ?? 'http://127.0.0.1:1337';
const PASSWORD = 'Password123';
const RUN = Date.now().toString(36).slice(-5);

const USERS = {
  scrum: 'scrum.master@appardas.local',
  lead: 'lead.dev@appardas.local',
  alex: 'dev.alex@appardas.local',
  maria: 'dev.maria@appardas.local',
  viewer: 'stakeholder@appardas.local',
};

// --- ANSI helpers -----------------------------------------------------------
const c = {
  g: (s: string) => `\x1b[32m${s}\x1b[0m`,
  r: (s: string) => `\x1b[31m${s}\x1b[0m`,
  y: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

interface Session {
  jwt: string;
  userId: number;
}

async function login(email: string): Promise<Session> {
  const res = await fetch(`${BASE}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: PASSWORD }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.jwt) {
    throw new Error(
      `Login failed for ${email} (${res.status}). Did you run \`npm run seed\`?`
    );
  }
  return { jwt: body.jwt, userId: body.user.id };
}

async function api(
  session: Session | null,
  method: string,
  path: string,
  body?: unknown
) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.jwt}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

// --- assertion harness ------------------------------------------------------
interface Result {
  role: string;
  assertion: string;
  expected: string;
  actual: string;
  pass: boolean;
}
const results: Result[] = [];

function record(
  role: string,
  assertion: string,
  expected: string,
  actual: string,
  pass: boolean
) {
  results.push({ role, assertion, expected, actual, pass });
}

const ok2xx = (s: number) => s >= 200 && s < 300;

async function main() {
  console.log(`\n${c.bold('RBAC verification')} → ${BASE}\n`);

  const scrum = await login(USERS.scrum);
  const lead = await login(USERS.lead);
  const alex = await login(USERS.alex);
  const maria = await login(USERS.maria);
  const viewer = await login(USERS.viewer);

  const cleanupTickets: string[] = []; // documentIds
  const cleanupUserIds: number[] = [];

  // === Scrum Master ========================================================
  {
    const create = await api(scrum, 'POST', '/tickets', {
      data: { title: `SM ticket ${RUN}`, status: 'todo', priority: 'medium', type: 'task' },
    });
    const doc = create.json?.data?.documentId;
    if (doc) cleanupTickets.push(doc);
    record('scrum_master', 'POST /tickets', '2xx', String(create.status), ok2xx(create.status));

    if (doc) {
      const upd = await api(scrum, 'PUT', `/tickets/${doc}`, {
        data: { title: `SM updated ${RUN}`, priority: 'high', status: 'in_progress' },
      });
      record('scrum_master', 'PUT /tickets/:id (all fields)', '200', String(upd.status), ok2xx(upd.status));
    }

    const inv = await api(scrum, 'POST', '/members/invite', {
      username: `sm_new_${RUN}`,
      email: `sm_new_${RUN}@test.local`,
      role: 'scrum_master',
    });
    if (inv.json?.data?.id) cleanupUserIds.push(inv.json.data.id);
    record('scrum_master', 'POST /members/invite (scrum_master)', '2xx', String(inv.status), ok2xx(inv.status));
  }

  // === Lead Dev ============================================================
  {
    const create = await api(lead, 'POST', '/tickets', {
      data: { title: `LD ticket ${RUN}`, status: 'todo', priority: 'low', type: 'feature' },
    });
    const doc = create.json?.data?.documentId;
    if (doc) cleanupTickets.push(doc);
    record('lead_dev', 'POST /tickets', '2xx', String(create.status), ok2xx(create.status));

    const invDev = await api(lead, 'POST', '/members/invite', {
      username: `ld_dev_${RUN}`,
      email: `ld_dev_${RUN}@test.local`,
      role: 'developer',
    });
    if (invDev.json?.data?.id) cleanupUserIds.push(invDev.json.data.id);
    record('lead_dev', 'POST /members/invite (developer)', '2xx', String(invDev.status), ok2xx(invDev.status));

    const invSM = await api(lead, 'POST', '/members/invite', {
      username: `ld_sm_${RUN}`,
      email: `ld_sm_${RUN}@test.local`,
      role: 'scrum_master',
    });
    if (invSM.json?.data?.id) cleanupUserIds.push(invSM.json.data.id);
    record('lead_dev', 'POST /members/invite (scrum_master) → denied', '403', String(invSM.status), invSM.status === 403);

    // promote an existing developer (alex) to scrum_master → denied
    const promote = await api(lead, 'PUT', `/members/${alex.userId}/role`, {
      role: 'scrum_master',
    });
    record('lead_dev', 'PUT /members/:id/role → scrum_master (denied)', '403', String(promote.status), promote.status === 403);
  }

  // === Fixture tickets for developer row/field-level tests =================
  const fxAlex = await api(scrum, 'POST', '/tickets', {
    data: { title: `FX alex ${RUN}`, status: 'todo', priority: 'medium', type: 'task', assignee: alex.userId },
  });
  const fxMaria = await api(scrum, 'POST', '/tickets', {
    data: { title: `FX maria ${RUN}`, status: 'todo', priority: 'medium', type: 'task', assignee: maria.userId },
  });
  const docAlex = fxAlex.json?.data?.documentId;
  const docMaria = fxMaria.json?.data?.documentId;
  if (docAlex) cleanupTickets.push(docAlex);
  if (docMaria) cleanupTickets.push(docMaria);
  const originalTitle = `FX alex ${RUN}`;

  // === Developer (alex) ====================================================
  {
    // status update on own ticket → allowed
    const statusUpd = await api(alex, 'PUT', `/tickets/${docAlex}`, {
      data: { status: 'in_progress' },
    });
    record('developer', 'PUT /tickets/:id status (assigned)', '200', String(statusUpd.status), ok2xx(statusUpd.status));

    // attempt to change title on own ticket → field stripped
    await api(alex, 'PUT', `/tickets/${docAlex}`, {
      data: { title: 'HACKED TITLE', status: 'in_review' },
    });
    const after = await api(scrum, 'GET', `/tickets/${docAlex}`);
    const title = after.json?.data?.title;
    const status = after.json?.data?.status;
    const stripped = title === originalTitle && status === 'in_review';
    record(
      'developer',
      'PUT /tickets/:id title → field stripped',
      'title unchanged',
      stripped ? `title kept, status=${status}` : `title="${title}"`,
      stripped
    );

    // update a peer's ticket → denied
    const peer = await api(alex, 'PUT', `/tickets/${docMaria}`, {
      data: { status: 'done' },
    });
    record('developer', "PUT /tickets/:id (peer's ticket)", '403', String(peer.status), peer.status === 403);

    // delete → denied
    const del = await api(alex, 'DELETE', `/tickets/${docAlex}`);
    record('developer', 'DELETE /tickets/:id', '403', String(del.status), del.status === 403);

    // invite → denied
    const inv = await api(alex, 'POST', '/members/invite', {
      username: `dev_x_${RUN}`,
      email: `dev_x_${RUN}@test.local`,
      role: 'developer',
    });
    record('developer', 'POST /members/invite', '403', String(inv.status), inv.status === 403);
  }

  // === Viewer ==============================================================
  {
    const list = await api(viewer, 'GET', '/tickets');
    record('viewer', 'GET /tickets', '200', String(list.status), ok2xx(list.status));

    const create = await api(viewer, 'POST', '/tickets', {
      data: { title: `V ticket ${RUN}`, status: 'todo', priority: 'low', type: 'task' },
    });
    if (create.json?.data?.documentId) cleanupTickets.push(create.json.data.documentId);
    record('viewer', 'POST /tickets', '403', String(create.status), create.status === 403);

    const upd = await api(viewer, 'PUT', `/tickets/${docMaria}`, {
      data: { status: 'done' },
    });
    record('viewer', 'PUT /tickets/:id', '403', String(upd.status), upd.status === 403);
  }

  // === Cleanup =============================================================
  for (const doc of cleanupTickets) {
    await api(scrum, 'DELETE', `/tickets/${doc}`).catch(() => {});
  }
  for (const id of cleanupUserIds) {
    await api(scrum, 'PUT', `/members/${id}/deactivate`).catch(() => {});
  }

  // === Report ==============================================================
  printTable(results);

  const failed = results.filter((x) => !x.pass);
  console.log(
    `\n${failed.length === 0 ? c.g('ALL PASS') : c.r('FAILURES')}  ` +
      `${results.length - failed.length}/${results.length} assertions passed\n`
  );
  process.exit(failed.length ? 1 : 0);
}

function printTable(rows: Result[]) {
  const headers = ['Role', 'Assertion', 'Expected', 'Actual', 'Result'];
  const widths = [13, 42, 16, 22, 6];
  const cellText = (cell: string, i: number) => {
    const raw =
      cell.length > widths[i] ? cell.slice(0, widths[i] - 1) + '…' : cell;
    return raw.padEnd(widths[i]);
  };
  const line = (cells: string[]) =>
    cells.map((cell, i) => cellText(cell, i)).join(c.dim(' │ '));

  console.log('\n' + c.bold(line(headers)));
  console.log(
    c.dim('─'.repeat(widths.reduce((a, b) => a + b, 0) + widths.length * 3))
  );
  let lastRole = '';
  for (const row of rows) {
    const roleCell = row.role === lastRole ? '' : row.role;
    lastRole = row.role;
    const cells = [roleCell, row.assertion, row.expected, row.actual];
    const prefix = cells.map((cell, i) => cellText(cell, i)).join(c.dim(' │ '));
    const mark = row.pass ? c.g('PASS') : c.r('FAIL');
    console.log(prefix + c.dim(' │ ') + mark);
  }
}

main().catch((err) => {
  console.error(c.r('\nRBAC run error: ') + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
