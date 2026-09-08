# Scan & Propose Missing Tests — Decentralized Chat App

You are a senior engineer on a **decentralized p2p chat app** built in React Native.
Tests are **user stories and feature specifications**, not just unit checks.

Your job is to **incrementally harden the entire project** — cycling over all source files, not just ones that already have tests. Each run picks the single most neglected area of the codebase (measured by git age of both source and test files) and proposes up to 10 missing test scenarios, writing them directly as `test.todo()` into the appropriate test file. Over many runs this produces complete feature coverage bottom-up, file by file.

---

## Step 1 — Find the target (whole-project scan)

Scan **all files tracked by git**, not just a specific directory.

### 1a — Get all source files (everything git-tracked that is not a test file)

```bash
git ls-files | grep -vE "(^|/)test/" | grep -vE "\.(md|json|yaml|yml|lock|png|svg)$"
```

### 1b — Get all test files (everything under the `test/` directory)

```bash
git ls-files test/
```

### 1c — Infer test file organization from what already exists

Before doing anything else, **read the existing `test/` directory structure** and learn from it:

```bash
git ls-files test/
```

Observe and internalize:

- What **subdirectory structure** exists (does it mirror `src/`? group by feature? by type?)
- What **filename suffixes** are used (`.test.ts`, `.spec.ts`, `.journey.test.ts`, `.e2e.ts`, etc.)
- What **naming patterns** correlate files to source files (basename match? kebab-case? folder grouping?)
- Whether **one file per source** or **multiple concern-split files** is already the norm

Use these observations as the convention for all decisions: where to create new files, what to name them, and how to group concerns when splitting. Do not invent a new convention — extend the one already present.

### 1d — Milestone filter (apply before scoring)

This project is currently in **Milestone 1: Account · Contacts · Direct Messages**.

Before scoring, **exclude** any source file whose primary concern is outside this milestone. Concretely, skip files that are primarily about:

- Groups / group messages (`groups`, `groupMessages`, `GroupConversationScreen`, `GroupMessagesScreen`, `GroupScreen`, …)
- Articles / feed (`articles`, `ArticlesScreen`, `EditArticleScreen`, …)
- Events / calendar (`EventsScreen`, `MemitaCalendar`, …)
- Places / map (`PlacesScreen`, `GeoMap`, `CoordsInput`, …)
- Any other feature area not directly related to account management, contact management, or 1-to-1 direct messaging

Files that are shared infrastructure used by in-scope features (e.g. `Routing.tsx`, `Main.tsx`, `Theme.tsx`, `cryptography/`, `storage/`, `queries/helpers.ts`) are **not** excluded — they support the milestone and are fair game.

### 1e — Score each remaining source file (lower = more neglected = higher priority)

First, assign a **file-type tier** that scales how aggressively age is counted:

| File type                       | Examples                                                                                                                                                                    | Age multiplier        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Tier A** — UI / screen code   | `.tsx` files (screens, components, navigation)                                                                                                                              | ×2.0 (highest weight) |
| **Tier B** — pure product logic | `.ts` files that are not infra/network/storage (e.g. `queries/`, `cryptography/`, `store/`)                                                                                 | ×1.0 (full weight)    |
| **Tier C** — infra / network    | `.ts` files under `network/`, `storage/`, files named `*Network*`, `*Websocket*`, `*Bare*`, `*Server*`, `*.web.ts`, `*.d.ts`, pure adapter/polyfill files                   | ×0.2 (ages slowly)    |
| **Tier D** — config / tooling   | `*.config.*`, `babel.config.*`, `metro.config.*`, `jest.config.*`, `.eslintrc`, `tsconfig*.json`, `package.json`, `Gemfile`, `Podfile`, `*.gradle`, `*.plist`, `*.xcconfig` | ×0.1                  |
| **Tier E** — scripts / CI       | `*.sh`, `.github/workflows/*.yml`, `Makefile`, `Dockerfile`                                                                                                                 | ×0.1                  |

Then compute the neglect score:

| Signal                                                    | Weight                               |
| --------------------------------------------------------- | ------------------------------------ |
| Source file has **no correlated test file at all**        | −1000                                |
| Source file last-commit age (days) × file-type multiplier | −1 per weighted day                  |
| Oldest correlated test file last-commit age (days)        | −0.5 per day                         |
| Total lines across all correlated test files              | +1 per line (already-covered ground) |

Pick the source file with the **lowest score**.

> Rationale: a config file untouched for 90 days scores the same as a `.ts` file untouched for 27 days. Config files still cycle in — they just cycle in less urgently than product code.

### 1f — Choose which test file to write into

Once the source file is selected:

- If **no test files exist** → create `test/<mirrored-path>/<basename>.test.ts`
- If test files exist → pick the **oldest-committed** one **under 500 lines**
- If **all correlated test files are at or above 450 lines** → trigger the auto-split procedure (see Step 1g)

### 1g — Skip rules

- Source file committed within last 14 days AND at least one correlated test file exists → skip, pick next

### 1h — Auto-split procedure

When a test file reaches 450+ lines it is a candidate for splitting. Do this **before** writing new proposals:

1. Read the full file
2. Group all existing `describe` blocks by **concern** (happy path, offline, error states, journeys, edge cases, etc.)
3. Look at how other large test files in the project have already been split — use the same naming and placement pattern
4. Decide the split: keep the most core concern in the original file, move the rest into new sibling files named and placed consistently with the existing convention inferred in Step 1c
5. Rewrite the original file with only its kept section (preserve all imports needed for that section)
6. Create each new file with a header referencing the origin:
   ```ts
   // split from: <original test file path> — <concern label>
   ```
7. After splitting, write the new `test.todo()` proposals into whichever file best fits their tier
8. In the run summary, list all files created and modified by the split

---

## Step 2 — Read context

Read, in this order:

1. The chosen **source file** (full)
2. **All correlated test files** for that source file (read every one — proposals must not duplicate anything across all of them)
3. The **most recently committed test file** in the entire project (for style/template):

```bash
git ls-files test/ | while read f; do
  echo "$(git log -1 --format="%ci" -- "$f") $f"
done | sort -r | head -1
```

Then read that file and locate the **last `describe` or `test` block added** — use it as the exact style template.

Use the most recent test block as the **exact template** for formatting, describe/it nesting, mock style, and assertion patterns. Match it precisely.

---

## Step 3 — Understand the domain

This is a **decentralized p2p chat app** currently focused on **Milestone 1: Account · Contacts · Direct Messages**. Draw inspiration from WhatsApp, Telegram, Delta Chat, Briar, Slack, and classic email when identifying missing scenarios.

### In-scope feature areas for this milestone

- **Account / identity**
  - Create account with a display name
  - Switch between multiple local accounts
  - Edit own display name
  - Export and import account (backup / restore)
  - Delete account
  - Share own account ID (copy to clipboard, QR code)

- **Contacts**
  - Add contact by pasting their account ID
  - Assign and edit a local nickname
  - View contact profile (their public name, account ID)
  - Delete / remove a contact
  - Contact list shows all contacts with names
  - Contact list is empty state when no contacts added

- **Direct messaging (1-to-1)**
  - Send a plain-text message
  - Receive a message from a contact (message appears in conversation)
  - Message history is persisted across app restarts
  - Conversation list shows latest message preview and contact name
  - Unread badge / indicator on conversations with new messages
  - Open a conversation from the conversation list
  - Messages display timestamps
  - Long message (many characters) renders without truncation or crash
  - Empty conversation state (no messages yet)
  - Send message while offline — queued and delivered on reconnect
  - Message ordering is chronological
  - Scroll to bottom when new message arrives
  - User can copy a message text to clipboard

- **Settings / app-level (in-scope)**
  - Language / locale selection
  - Theme (light / dark / system)
  - Device settings screen is reachable from main navigation

### Out-of-scope for this milestone (skip when proposing)

- Groups, group messages, group management
- Articles, feed, publishing
- Events, calendar
- Places, maps, geolocation
- Media attachments (images, files) — deferred
- Notifications — deferred

---

## Step 4 — Prioritize gaps using this exact order

Focus on e2e user-level scenarios, unit tests are very low priority.
Propose tests in this priority sequence. Do not skip a tier unless it is already fully covered:

### Tier 1 — Happy path, single action from existing state

> User is set up, app is open, state is ready. One action, one outcome.
> Example: "user sends a text message to an online contact"

### Tier 2 — Alternative paths and useful secondary actions

> Variations on Tier 1: different inputs, optional flows, non-default choices.
> Example: "user sends a message with an emoji-only body"
> Example: "user copies a message to clipboard"

### Tier 3 — Medium journeys from app open

> 3–6 step flows starting from app already installed and logged in.
> Example: "user opens app, finds unread message, reads it, replies"

### Tier 4 — Full journeys from app start with empty / cold state

> Fresh install or cleared state. Covers onboarding + core flow end to end.
> Example: "new user installs app, creates identity, adds first contact, sends first message"

### Tier 5 — Corner cases

> Boundary values, race conditions, error recovery, adversarial input.
> Example: "message arrives while app is processing a key rotation"
> Example: "user sends to contact who goes offline mid-delivery"

Propose from the lowest-numbered tier that still has gaps. Mix tiers only if Tier 1–2 are fully covered.

---

## Step 5 — Write the proposals

- Propose **at most 10** `test.todo("")` lines per run, into the target file chosen in Steps 1e–1g
- If the target test file **does not exist**: create it using the location and naming convention inferred in Step 1c — do not invent a new pattern. Add a minimal shell:

  ```ts
  import { render } from "@testing-library/react-native";
  // TODO: add imports as tests are implemented

  describe("<SourceFileName>", () => {
    test.todo("...");
  });
  ```

- Do **not** write implementations — only `test.todo("plain English description")`
- Keep descriptions at the **user level**: what the user does and what they observe
- Before proposing, cross-check **all correlated test files** — never duplicate a scenario already covered anywhere
- Match the nesting/grouping style of the template block from Step 2
- Write proposals into the file whose **concern best matches** the tier being filled (e.g. new journeys go into the `.journey.` file if it exists)
- Strongly prefer queries by proprity listed here https://testing-library.com/docs/queries/about/

### Example output shape (adapt to actual template style)

```ts
// --- AI proposals: <date> ---
describe("sending messages", () => {
  test.todo("user sends a text message to an online contact");
  test.todo(
    "user sends a message while contact is offline and it delivers on reconnect",
  );
  test.todo("user sees 'sending' indicator while message is in flight");
});
```

---

## Step 6 — Code smell and debt review

After writing test proposals, re-read the **source file** and identify up to **3 code smells or debt items** worth flagging. Print them as a short plain-text list in the run summary — do not modify any source file.

Look for:

- **Complexity** — functions doing too many things, deeply nested logic, long parameter lists
- **Naming** — misleading names, single-letter variables outside loops, inconsistent casing
- **Dead code** — unused exports, unreachable branches, commented-out blocks
- **Fragility** — hardcoded values, magic numbers, missing null checks, unhandled promise rejections
- **Coupling** — a module importing too many siblings, business logic leaking into UI components
- **Staleness** — TODO/FIXME comments, deprecated API usage, patterns inconsistent with the rest of the codebase

Format each item as one line:

```
⚠ <file>:<line> — <short description of the problem>
```

Only flag things that are **clear and actionable**. Skip if the file is clean — do not invent issues. Max 3 items.

- Do not propose anything already covered by `test(`, `it(`, `test.todo(`, or `describe(` blocks in the file
- Do not touch `test.skip("wont:` lines — those are permanent closed decisions
- Do not modify any existing test logic
- Do not propose more than 10 todos in a single run
- Do not scan source files committed within the last 14 days that already have a test file

---

## Won't-implement convention (for the developer to use after review)

```ts
// Keep → implement later
test.todo("user sends a message with an emoji-only body");

// Remove → not interested, just delete the line

// Explicitly out of scope → convert to:
test.skip(
  "wont: out of scope v1 | user sends a message with an emoji-only body",
);
```

`wont:` lines are never deleted — they document deliberate decisions.
Audit all decisions:

```bash
grep -r "wont:" test/
```
