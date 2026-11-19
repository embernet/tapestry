'use strict';

// Manage local accounts:  node src/auth/cli.js <db path> add|remove|list [username] [display name]
// The password is read from stdin (never from the command line, which shows in `ps`).
// Wrapped by scripts/user.sh, which runs it inside the app's container.

const { DatabaseSync } = require('node:sqlite');
const { createStore } = require('./store');

async function readPassword() {
  const chunks = [];
  if (process.stdin.isTTY) {
    process.stderr.write('Password (min 10 chars, input hidden): ');
    process.stdin.setRawMode(true);
    return new Promise((resolve) => {
      let pw = '';
      process.stdin.on('data', (b) => {
        for (const ch of b.toString('utf8')) {
          if (ch === '\r' || ch === '\n') { process.stdin.setRawMode(false); process.stderr.write('\n'); process.stdin.pause(); return resolve(pw); }
          if (ch === '\u0003') process.exit(130);
          if (ch === '\u007f') pw = pw.slice(0, -1); else pw += ch;
        }
      });
    });
  }
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
}

async function main() {
  const [dbPath, cmd, username, ...nameParts] = process.argv.slice(2);
  if (!dbPath || !['add', 'remove', 'list'].includes(cmd)) {
    console.error('usage: cli.js <db> add <username> [display name] | remove <username> | list');
    process.exit(2);
  }
  const store = createStore(new DatabaseSync(dbPath));
  if (cmd === 'list') {
    for (const u of store.listLocalUsers()) console.log(`${u.username}\t${u.display_name}`);
  } else if (cmd === 'remove') {
    if (!store.removeLocalUser(username)) { console.error(`no such user: ${username}`); process.exit(1); }
    store.deleteSessionsFor(`local:${username}`);
    console.log(`removed ${username} and signed them out`);
  } else {
    store.addLocalUser(String(username || '').toLowerCase(), nameParts.join(' ') || username, await readPassword());
    store.deleteSessionsFor(`local:${String(username).toLowerCase()}`);
    console.log(`saved ${username}`);
  }
}

main().catch((err) => { console.error(err.message); process.exit(1); });
