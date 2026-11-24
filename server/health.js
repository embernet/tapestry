'use strict';
// Health endpoints, the suite standard (horizon-infra standards.md §12).
// The same file is in tapestry (server/health.js) and breakthrough (src/health.js).
//
//   GET /healthz  alive: 200 { status: 'ok', app, version, commit, builtAt, uptimeSeconds } while the process runs
//   GET /readyz   ready: 200 { status: 'ok', ..., checks: { <name>: { ok, ms } } }, or
//                 503 { status: 'unavailable', ..., checks, failing: [<name>, ...] }
//
// Open (mount before any sign-in middleware), Cache-Control: no-store, and no
// error details in the answer: failures go to the log. Each check is an async
// function that throws when its dependency cannot serve; it gets at most
// timeoutMs (<= 3 s). One run of the checks is shared while in flight and its
// answer reused for cacheMs, so heavy polling never reaches a dependency once
// per request.

// `git describe --tags --always --dirty` baked in at build time (APP_VERSION),
// without the leading "v"; else the package version.
function resolveVersion(appVersion, pkgVersion) {
  const v = String(appVersion || '').trim().replace(/^v(?=\d)/, '');
  return v || String(pkgVersion || '');
}

// The build's commit (`git rev-parse --short HEAD`, APP_COMMIT) and build time
// (ISO-8601 UTC, APP_BUILT_AT), baked in like the version. Unset or malformed
// (a plain `docker compose` build, tests): undefined, so left out, never guessed.
function resolveBuild(env = process.env) {
  const commit = String(env.APP_COMMIT || '').trim();
  const builtAt = String(env.APP_BUILT_AT || '').trim();
  return {
    commit: /^[0-9a-f]{4,40}$/.test(commit) ? commit : undefined,
    builtAt: /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(builtAt) ? builtAt : undefined,
  };
}

function withTimeout(fn, ms) {
  let timer;
  return Promise.race([
    Promise.resolve().then(fn),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no answer within ${ms} ms`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

function mountHealth(app, { appName, version, commit, builtAt, checks = {}, timeoutMs = 3000, cacheMs = 2000, log = console.warn } = {}) {
  const startedAt = Date.now();
  const base = () => ({ app: appName, version, commit, builtAt, uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) });

  let last = null; // { at, promise }; at = Infinity while in flight
  function runChecks() {
    if (last && Date.now() - last.at < cacheMs) return last.promise;
    const run = { at: Infinity, promise: null };
    run.promise = Promise.all(Object.entries(checks).map(async ([name, fn]) => {
      const t0 = Date.now();
      try {
        await withTimeout(fn, timeoutMs);
        return [name, { ok: true, ms: Date.now() - t0 }];
      } catch (err) {
        log(`[readyz] ${name} check failed: ${err && err.message ? err.message : err}`);
        return [name, { ok: false, ms: Date.now() - t0 }];
      }
    })).then(Object.fromEntries).finally(() => { run.at = Date.now(); });
    last = run;
    return run.promise;
  }

  app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ status: 'ok', ...base() });
  });

  app.get('/readyz', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const results = await runChecks();
    const failing = Object.keys(results).filter((k) => !results[k].ok);
    res.status(failing.length ? 503 : 200).json({
      status: failing.length ? 'unavailable' : 'ok',
      ...base(),
      checks: results,
      ...(failing.length ? { failing } : {}),
    });
  });
}

module.exports = { mountHealth, resolveVersion, resolveBuild };
