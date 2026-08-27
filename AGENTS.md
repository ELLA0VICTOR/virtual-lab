# Project continuity

This repository is the **Quadrotor Virtual Laboratory**, a final-year Mechatronics Engineering project for the Federal University of Technology, Minna. It is a standalone Vite + React + TypeScript application intended for iframe embedding in the AcademIQ LMS.

## Protect the academic deliverables

- Treat `documentation/FINAL_PROJECT_REPORT_SUPERVISOR_CORRECTED.docx`, `documentation/generate_full_report.py`, and `documentation/figures/` as priority deliverables covering Chapters 1–5 and their supporting figures.
- Do not delete, replace, regenerate, or rewrite a final report or figure without first preserving the current version and getting explicit approval.
- Preserve uncommitted and untracked work. Before making changes, inspect `git status --short --branch` and read `REINSTALL_HANDOFF.md` when it exists.
- Never display, commit, or copy recovery codes, private keys, seed phrases, access tokens, or passphrases into project files or chat output.

## Working conventions

- Read `README.md` and `instructions.md` before substantial implementation work.
- Keep the app standalone and iframe-compatible; the host LMS is a separate application.
- Keep physics and control-system behavior defensible and documented. Avoid changing evaluation numbers in the report unless the associated experiment is rerun and the evidence is updated.
- Use `npm install`, `npm run build`, and `npm run lint` for setup and verification.

## Reinstall recovery

After a Windows reinstall, read `REINSTALL_HANDOFF.md`, inspect the restored working tree, and summarize the current state before changing anything.
