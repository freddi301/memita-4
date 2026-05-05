---
name: update-translations
description: "One-shot Lingui translation updater. Script-first flow: extract, detect empty+stale from HEAD vs worktree/index, AI only gets msgid + target language (+existing msgstr hint), apply updates, compile, then print translation delta table."
argument-hint: "language code(s) (e.g. de,fr,es) or omit for all"
---

# Update Translations (One-Shot)

## Contract

- Use scripts for everything possible.
- AI context must be minimal: `target language`, `msgid`, and optional `existing msgstr` hint only.
- Stale detection must use `git diff HEAD -- ...` (includes staged + unstaged).
- Run extract without `--clean`.
- Run compile without `--strict`.
- Final assistant output must be only a table with columns:
  - `language`
  - `msgid`
  - `existing`
  - `updated`

## Permission/Prompt Minimization

- Execute each phase as a single terminal command block (prepare once, apply once).
- Do not split into many small terminal commands unless debugging is required.

## Phase 1: Prepare Payloads (One Command)

Run this command exactly (standalone; do not chain after heredoc):

```bash
python3 - <<'PY'
import json
import re
import subprocess
from pathlib import Path

langs = ["zh","es","hi","bn","pt","ru","ja","vi","tr","mr","te","ko","fr","ta","ar","de","ur","jv","it","th","gu","ha","kn","fa","pl","id","sw"]
labels = {
  "zh":"Chinese","es":"Spanish","hi":"Hindi","bn":"Bengali","pt":"Portuguese","ru":"Russian",
  "ja":"Japanese","vi":"Vietnamese","tr":"Turkish","mr":"Marathi","te":"Telugu","ko":"Korean",
  "fr":"French","ta":"Tamil","ar":"Arabic","de":"German","ur":"Urdu","jv":"Javanese","it":"Italian",
  "th":"Thai","gu":"Gujarati","ha":"Hausa","kn":"Kannada","fa":"Persian","pl":"Polish","id":"Indonesian","sw":"Swahili"
}

# Required pre-step in same phase
subprocess.check_call(["npx", "lingui", "extract"])

root = Path('.').resolve()
locales = root / 'components/i18n/locales'
out = Path('/tmp/ai-translation-inputs')
out.mkdir(parents=True, exist_ok=True)
chunk_size = 25

msgid_re = re.compile(r'^msgid "(.*)"$')
msgstr_re = re.compile(r'^msgstr "(.*)"$')
diff_re = re.compile(r'^[+-]msgid "(.*)"$')

diff = subprocess.check_output(
    ['git','diff','HEAD','--','components/i18n/locales/en/messages.po'],
    text=True,
    stderr=subprocess.DEVNULL,
)
old, new = set(), set()
for line in diff.splitlines():
    if line.startswith('---') or line.startswith('+++'):
        continue
    m = diff_re.match(line)
    if not m:
        continue
    s = m.group(1)
    if not s:
        continue
    (old if line.startswith('-') else new).add(s)
stale = new - old

summary = {
    "base_ref":"HEAD",
    "head_ref":"WORKTREE+INDEX",
    "stale_global_count":len(stale),
    "languages":{}
}

for lang in langs:
    po = locales / lang / 'messages.po'
    for p in out.glob(f'{lang}.txt'):
        p.unlink(missing_ok=True)
    for p in out.glob(f'{lang}.part*.txt'):
        p.unlink(missing_ok=True)

    lines = po.read_text(encoding='utf-8').splitlines()
    present, empty = set(), set()
    current_map = {}
    current = None
    for line in lines:
        m = msgid_re.match(line)
        if m:
            current = m.group(1)
            if current:
                present.add(current)
            continue
        m = msgstr_re.match(line)
        if m and current:
            current_map[current] = m.group(1)
            if m.group(1) == '':
                empty.add(current)
            current = None

    stale_candidates = stale & present
    stale_needs_ai = {
        s for s in stale_candidates
        if current_map.get(s, '') == '' or current_map.get(s, '') == s
    }
    unresolved = sorted(empty | stale_needs_ai)

    if not unresolved:
        summary['languages'][lang] = {
            "empty_count": len(empty),
            "stale_count": len(stale_candidates),
            "stale_needs_ai_count": len(stale_needs_ai),
            "total_for_ai": 0,
            "payload_count": 0,
            "outputs": [],
            "status": "skip-no-ai-needed"
        }
        continue

    outputs = []
    for i in range(0, len(unresolved), chunk_size):
        chunk = unresolved[i:i+chunk_size]
        idx = (i // chunk_size) + 1
        name = f"{lang}.txt" if len(unresolved) <= chunk_size else f"{lang}.part{idx}.txt"
        p = out / name
        body = [f"{msg}\t{current_map.get(msg, '')}" for msg in chunk]
        p.write_text("\n".join([f"Target language: {lang} ({labels[lang]})", "", *body]) + "\n", encoding='utf-8')
        outputs.append(str(p))

    summary['languages'][lang] = {
        "empty_count": len(empty),
        "stale_count": len(stale_candidates),
        "stale_needs_ai_count": len(stale_needs_ai),
        "total_for_ai": len(unresolved),
        "payload_count": len(outputs),
        "outputs": outputs,
        "status": "ready",
    }

(out / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(f"Wrote payloads to {out}")
print(f"Summary: {out / 'summary.json'}")
PY
```

## AI Input/Output Format

For each generated payload file:

- Input file rows are: `msgid<TAB>existing_msgstr`
- AI instruction:

```text
Target language is in the first line.
Input rows are msgid<TAB>existing_msgstr.
Return only TSV rows: msgid<TAB>msgstr
No commentary.
```

Save AI output files to `/tmp/ai-translation-results/<lang>.tsv`.

## Phase 2: Apply + Compile + Report (One Command)

Run this command after AI TSV files exist:

```bash
python3 - <<'PY'
import csv
import subprocess
from pathlib import Path

langs = ["zh","es","hi","bn","pt","ru","ja","vi","tr","mr","te","ko","fr","ta","ar","de","ur","jv","it","th","gu","ha","kn","fa","pl","id","sw"]
locales = Path('components/i18n/locales')
results = Path('/tmp/ai-translation-results')
report = Path('/tmp/ai-translation-report.tsv')

report_rows = []

for lang in langs:
    tsv = results / f'{lang}.tsv'
    if not tsv.exists():
        continue

    updates = {}
    for raw in tsv.read_text(encoding='utf-8').splitlines():
        if not raw.strip() or '\t' not in raw:
            continue
        msgid, msgstr = raw.split('\t', 1)
        msgid = msgid.strip()
        msgstr = msgstr.strip()
        if msgid:
            updates[msgid] = msgstr

    if not updates:
        continue

    po = locales / lang / 'messages.po'
    lines = po.read_text(encoding='utf-8').splitlines()
    out = []
    current = None
    for line in lines:
        if line.startswith('msgid "'):
            current = line[7:-1]
            out.append(line)
            continue
        if line.startswith('msgstr "') and current in updates:
            existing = line[8:-1]
            updated = updates[current]
            out.append(f'msgstr "{updated}"')
            if existing != updated:
                report_rows.append([lang, current, existing, updated])
            current = None
            continue
        out.append(line)
        if line == '':
            current = None

    po.write_text('\n'.join(out) + '\n', encoding='utf-8')

subprocess.check_call(["npx", "lingui", "compile"])

with report.open('w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, delimiter='\t')
    writer.writerow(['language', 'msgid', 'existing', 'updated'])
    writer.writerows(report_rows)

print(report)
PY
```

## Final Response Format (Strict)

When user asks to run this skill, return only this markdown table (no extra text):

| language | msgid | existing | updated |
| -------- | ----- | -------- | ------- |
| it       | hello | ciao     | salve   |

If there are no changes, return only:

| language | msgid | existing | updated |
| -------- | ----- | -------- | ------- |
