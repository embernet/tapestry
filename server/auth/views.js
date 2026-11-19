'use strict';

// Minimal, self-contained sign-in pages (inline CSS, light + dark), so the
// module works the same in every app without touching the app's own styles.

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const CSS = `
:root{--bg:#f5f6f8;--card:#fff;--fg:#1b1f24;--muted:#5d6670;--line:#d9dde2;--accent:#2f6fde;--err:#b42318;--errbg:#fdecea}
@media (prefers-color-scheme:dark){:root{--bg:#0f1216;--card:#171b21;--fg:#e7eaee;--muted:#9aa3ad;--line:#2a313a;--accent:#6ea0ff;--err:#ff8a80;--errbg:#3a1714}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
.card{width:100%;max-width:380px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:28px}
h1{font-size:1.35rem;margin:0 0 4px}p{margin:0 0 16px;color:var(--muted)}
label{display:block;font-size:.9rem;margin:14px 0 4px}input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--fg);font:inherit}
input:focus{outline:2px solid var(--accent);outline-offset:1px}
button,.btn{display:inline-block;margin-top:20px;width:100%;padding:10px 14px;border:0;border-radius:8px;background:var(--accent);color:#fff;font:inherit;font-weight:600;cursor:pointer;text-align:center;text-decoration:none}
.err{background:var(--errbg);color:var(--err);border-radius:8px;padding:8px 12px;margin:12px 0 0;font-size:.92rem}
.links{margin-top:16px;font-size:.92rem}.links a{color:var(--accent)}
code{font-size:.85em}`;

function shell(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head><body><main class="card">${inner}</main></body></html>`;
}

function loginPage({ appName, next, error, ssoOn, noUsers }) {
  return shell(`Sign in · ${appName}`, `
<h1>${esc(appName)}</h1>
<p>${ssoOn ? 'Local account sign-in.' : 'Sign in to continue.'}</p>
${error ? `<div class="err" role="alert">${esc(error)}</div>` : ''}
${noUsers ? '<div class="err">No local accounts exist yet. An administrator can add one with <code>scripts/user.sh add &lt;username&gt;</code>.</div>' : ''}
<form method="post" action="/local">
  <input type="hidden" name="next" value="${esc(next)}">
  <label for="u">Username</label><input id="u" name="username" autocomplete="username" autocapitalize="none" required autofocus>
  <label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Sign in</button>
</form>
${ssoOn ? `<div class="links"><a href="/login?next=${encodeURIComponent(next)}">Sign in with TIG-SSO instead</a></div>` : ''}`);
}

function messagePage({ appName, title, body, links = [] }) {
  return shell(`${title} · ${appName}`, `
<h1>${esc(title)}</h1><p>${esc(body)}</p>
<div class="links">${links.map(([t, href]) => `<a href="${esc(href)}">${esc(t)}</a>`).join(' &nbsp;·&nbsp; ')}</div>`);
}

module.exports = { loginPage, messagePage, esc };
