# Windows reinstall and Codex handoff

Snapshot date: **2026-08-27** (Africa/Lagos)

This file is a human-readable continuity record. It is intentionally free of credentials, private keys, recovery codes, passphrases, and access tokens.

## What this project is

`C:\Users\Victor\Desktop\virtual-lab` is a standalone Vite + React + TypeScript quadrotor control-systems laboratory for a final-year Mechatronics Engineering project at the Federal University of Technology, Minna. It includes a 6-DOF model, PID control loops, disturbances, guided learning, 3D visualization, charts, response metrics, graded challenges, and iframe integration for the AcademIQ LMS.

## Academic files that must survive

Inside this repository:

- `documentation/FINAL_PROJECT_REPORT_SUPERVISOR_CORRECTED.docx`
- `documentation/generate_full_report.py`
- `documentation/figures/` (editable Draw.io sources plus SVG/PNG outputs for Chapters 2–4)
- The complete repository, including `.git` and all untracked files

Outside this repository, the reinstall backup must also contain:

- `C:\Users\Victor\Desktop\CHAPTER 1-5\COMPLETE_PROJECT_CHAPTERS_ONE_TO_FIVE.docx`
- `C:\Users\Victor\Desktop\FINAL_YEAR_PROJECT_ONAILO_VICTOR_CHAPTERS_1-3_UPDATED.docx`
- All of `C:\Users\Victor\Documents`

The three main report documents differ in size and date. None should be treated as a duplicate or discarded.

## Git working state at this snapshot

- Branch: `main`, tracking `origin/main`
- HEAD: `3108aec` — `Added more lessons`
- Modified tracked files:
  - `package-lock.json`
  - `src/physics/metrics.ts`
  - `src/physics/pidController.ts`
  - `src/simulation/simulationStore.ts`
- Important untracked material includes `documentation/`, `tools/`, `.codex-ui-fidelity-pass.ps1`, and other local work shown by `git status`.

The current physics-related edits optimize response-metric calculation and avoid recomputing metrics when no history sample changed. The `pidController.ts` diff visible at the snapshot is only whitespace. Inspect the complete diff before deciding what to keep.

## Codex continuity

The active Codex home before reinstall is `C:\Users\Victor\.codex`. This installed build stores continuity data in local SQLite files and session files, including:

- `memories_1.sqlite` plus its `-wal` and `-shm` companions
- `sessions/` and `session_index.jsonl`
- `attachments/`
- `state_5.sqlite*` and `goals_1.sqlite*`
- `config.toml` and reviewed `rules/`

The backup script excludes `auth.json` and `.sandbox-secrets`. Sign in again after reinstall instead of restoring old authentication tokens. The Codex/VS Code processes must be fully closed when these database files are copied or restored.

Local Codex memory is useful but is not the only continuity mechanism. This handoff and `AGENTS.md` are the durable, readable source of truth if the internal database format changes.

## Restore order after Windows is installed

1. Sign in to the same Microsoft and OpenAI accounts, but authenticate fresh rather than restoring token files.
2. Restore the entire project folder, including `.git` and untracked files, to a normal local path.
3. Install Git, Node.js, VS Code, and the official OpenAI ChatGPT/Codex extension.
4. Launch Codex once, sign in, then fully close VS Code and Codex.
5. Preserve the newly created `.codex` folder as a rollback copy. Restore the saved continuity files only while every Codex process is closed.
6. Open the restored project and run `git status --short --branch` before installing dependencies or changing files.
7. Run `npm install`, `npm run build`, and `npm run lint` when ready to verify the restored project.

Use this first prompt after restore:

> Read `AGENTS.md` and `REINSTALL_HANDOFF.md` completely. Inspect `git status`, the documentation folder, and the current source diff. Summarize what was restored, what remains uncommitted, and the safest next step. Do not modify anything yet.

## Backup status

At the time this handoff was created, Windows showed only the internal `C:` drive and OneDrive was not protecting Documents. **This file is not yet reinstall-safe until the prepared backup has been copied to an encrypted external or verified cloud destination and its hashes have been checked.**
