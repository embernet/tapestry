# Engineering Charter

The universal rules for any team or agent that writes code in this ecosystem —
monorepo-bound or standalone. They sit *above* the Ra-ecosystem instructions
(team-bus, inbox, worktrees) because they apply to anything that ships software,
whether or not it lives in this repository.

Every engineering team's `AGENTS.md` references this file. Every standalone repo
(those cloned into a team's `repos/`, which cannot see this file) carries its own
copy as `ENGINEERING_CHARTER.md` at its root — this root file is the master, and
updates propagate outward to the copies.

---

## 1. App-owned dialogs only

Never use the browser's `alert()`, `confirm()`, or `prompt()`. Every app uses its
own modal system so the experience is consistent and never looks like a browser
warning the user can't trust. Forge ships `shared/modal.js` (`AppModal`) as the
reference implementation for monorepo apps; standalone apps provide an equivalent
in-app modal.

**Rationale:** native dialogs are unstyleable, block the event loop, look like
malware or browser chrome, and break the app's visual contract with the user.

## 2. Server-side storage by default

Persist user data on the server. `localStorage` is not the primary store unless
the data is inherently local to the device (UI preferences, draft state, a cache).
If a user would lose work by switching browser or machine, it belongs on the server.

## 3. Documents stand alone

A document body contains the document — nothing else. No version change-notes, no
framing narration ("this section will explain…"), no audience commentary. If a
reader needs the history of a document, that lives outside the document.

## 4. British English

All user-facing copy, documentation, and commit messages use British English.
Engineering identifiers (code, APIs, library names) follow their source.

## 5. Accessibility is non-negotiable

Keyboard reachable, focus managed (especially in and out of modals), semantic
markup, and sufficient colour contrast. An interaction that only works with a
mouse is unfinished.

## 6. No silent failure

Errors surface to the user in-app, in language they can act on. Nothing fails
quietly to the console. A caught exception that the user should know about is a
visible message, not a swallowed log line.

## 7. Reuse before rebuild

Before building a component, check whether a shared one already exists; before
building something bespoke that other apps will also want, build it to be shared.
Consistency across apps and reduced duplicated effort are both the goal.

**The shared-component layer and its promotion pipeline are owned by Forge.** This
extends what Forge already runs for the monorepo (`/shared/`) to reach standalone
repos too. The pipeline:

- **Identify** a component used — or wanted — in more than one place (tag controls,
  a kanban board, a graph canvas are prime candidates).
- **Promote** it to a canonical home. Each genuinely-shared component becomes its
  own git repo/project so it is versioned and ownable independently.
- **Deliver** by one of two models, chosen per component:
  - *Versioned package* — for framework-agnostic primitives that are stable enough
    that versioning earns its keep (e.g. a tag control, a kanban). Consumers depend
    on a pinned version.
  - *Copy-paste-with-provenance* — the default for everything else. The component
    lives in its canonical repo; consumers copy it in with a recorded source and
    version, and re-sync on update. This matches the standalone-repo philosophy of
    staying self-contained, while keeping a traceable origin.

Promote sparingly and only when reuse is real — a premature shared component costs
more than the duplication it removes. When in doubt, brief Forge rather than
publishing unilaterally.

## 8. Port reservations

Every long-running service binds a port, and a clash silently breaks whichever
service starts second. To keep Forge, Lab, Tapestry, and every team out of each
other's way, ports are allocated from reserved blocks. A service never binds a
port outside its team's block, and never hard-codes a port — it reads `PORT` (or
the service's documented env var) so the reserved value is set at deploy time, not
baked into code.

| Block | Owner | Use |
|-------|-------|-----|
| **3000–3099** | Apex / Forge | Core ecosystem services (Apex Portal 3010, Forge Portal 3020). Forge allocates within. |
| **4000–4099** | All teams | Team portals — one per team (Innovation 4001, Writing 4005, Personal 4010, Test 4020, Void 4025, Random 4030, Cooking 4040, Photography 4050, Signal 4060). |
| **4100–4199** | Tapestry | Tapestry team services — Studio pre-prod (4100) and any future tapestry service. |
| **4200–4299** | Lab | Pre-prod / preview services for Lab's standalone apps. |

**Authority:** Forge maintains the master allocation (in `data/inventory.json`
via Janus). A team picks the next free port *within its own block* and tells
Forge so the inventory stays the single source of truth. Need a new block?
Ask Forge — don't squat an unreserved range.
