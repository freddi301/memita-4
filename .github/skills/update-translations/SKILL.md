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

Payloads are grouped **by msgid across all languages** (not per-language). Each payload file covers up to `chunk_size` msgids × all languages that need that msgid translated. This means one AI call handles all languages for the same string simultaneously.

Run this command exactly (standalone; do not chain after heredoc):

```bash
python3 - <<'PY'
import json
import re
import subprocess
from pathlib import Path
from collections import defaultdict

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
# Clean old files
for p in out.glob('*.txt'):
    p.unlink(missing_ok=True)
chunk_size = 25  # msgids per payload file

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

# Per-language current translations
lang_maps = {}
for lang in langs:
    po = locales / lang / 'messages.po'
    lines = po.read_text(encoding='utf-8').splitlines()
    current_map = {}
    current = None
    for line in lines:
        m = msgid_re.match(line)
        if m:
            current = m.group(1)
            continue
        m = msgstr_re.match(line)
        if m and current:
            current_map[current] = m.group(1)
            current = None
    lang_maps[lang] = current_map

# Build cross-language index: msgid -> {lang -> existing_msgstr}
# Only include (msgid, lang) pairs that need AI
need: dict[str, dict[str, str]] = defaultdict(dict)  # need[msgid][lang] = existing
for lang in langs:
    current_map = lang_maps[lang]
    present = set(current_map)
    empty = {k for k, v in current_map.items() if v == '' and k}
    stale_candidates = stale & present
    stale_needs_ai = {s for s in stale_candidates if current_map.get(s,'') in ('', s)}
    for msgid in sorted(empty | stale_needs_ai):
        need[msgid][lang] = current_map.get(msgid, '')

all_msgids = sorted(need)

if not all_msgids:
    print("Nothing to translate.")
else:
    outputs = []
    for i in range(0, len(all_msgids), chunk_size):
        chunk = all_msgids[i:i+chunk_size]
        idx = (i // chunk_size) + 1
        name = f"chunk{idx}.txt" if len(all_msgids) > chunk_size else "chunk1.txt"
        p = out / name
        lines_out = [
            "Translate each msgid into every listed target language.",
            "Return TSV rows: msgid<TAB>lang<TAB>msgstr — one row per (msgid, language) pair.",
            "No commentary.",
            "",
        ]
        for msgid in chunk:
            lang_existing = need[msgid]
            langs_needed = sorted(lang_existing)
            existing_hint = "; ".join(
                f"{lang}({labels[lang]}): {lang_existing[lang]!r}" if lang_existing[lang] else f"{lang}({labels[lang]})"
                for lang in langs_needed
            )
            lines_out.append(f"{msgid}\t{existing_hint}")
        p.write_text("\n".join(lines_out) + "\n", encoding='utf-8')
        outputs.append(str(p))
        print(f"  {p}  ({len(chunk)} msgids × {len(need[chunk[0]])} langs)")

summary = {
    "base_ref": "HEAD",
    "head_ref": "WORKTREE+INDEX",
    "stale_global_count": len(stale),
    "total_msgids_for_ai": len(all_msgids),
    "payload_files": outputs if all_msgids else [],
}
(out / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(f"\nWrote {len(outputs)} payload file(s) to {out}")
print(f"Summary: {out / 'summary.json'}")
PY
```

## AI Input/Output Format

Each payload file covers multiple msgids × multiple languages.

- Header lines explain the format.
- Body rows: `msgid<TAB><lang>(<Label>)[: 'existing']` — one row per msgid, listing all languages needing it.
- AI instruction (already embedded in the file header):

```text
Translate each msgid into every listed target language.
Return TSV rows: msgid<TAB>lang<TAB>msgstr — one row per (msgid, language) pair.
No commentary.
```

Save AI output to a **single file**: `/tmp/ai-translation-results/translations.tsv`  
Format: `msgid<TAB>lang<TAB>msgstr` (one row per msgid+lang combination).

## Phase 2: Apply + Compile + Report (One Command)

Run this command after the AI TSV file exists at `/tmp/ai-translation-results/translations.tsv`:

```bash
python3 - <<'PY'
import csv
import subprocess
from collections import defaultdict
from pathlib import Path

langs = ["zh","es","hi","bn","pt","ru","ja","vi","tr","mr","te","ko","fr","ta","ar","de","ur","jv","it","th","gu","ha","kn","fa","pl","id","sw"]
locales = Path('components/i18n/locales')
results = Path('/tmp/ai-translation-results')
report = Path('/tmp/ai-translation-report.tsv')

# Load all translations from single file: msgid<TAB>lang<TAB>msgstr
updates: dict[str, dict[str, str]] = defaultdict(dict)  # updates[lang][msgid] = msgstr
tsv = results / 'translations.tsv'
for raw in tsv.read_text(encoding='utf-8').splitlines():
    if not raw.strip() or raw.count('\t') < 2:
        continue
    parts = raw.split('\t', 2)
    msgid, lang, msgstr = parts[0].strip(), parts[1].strip(), parts[2].strip()
    if msgid and lang:
        updates[lang][msgid] = msgstr

report_rows = []

for lang in langs:
    lang_updates = updates.get(lang)
    if not lang_updates:
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
        if line.startswith('msgstr "') and current in lang_updates:
            existing = line[8:-1]
            updated = lang_updates[current]
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
