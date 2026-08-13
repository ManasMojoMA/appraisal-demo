# ⚠ This is the PUBLIC DEMO copy of Appraisal Portal

**Source of truth is `faculty_appraisal_portal` — not this folder.**

This copy exists so a recruiter can log in and click around without any risk to the
live system. It was created by copying the original with secrets and real data
excluded, then re-initialising git so none of the original history came with it.

## Rules

1. **Never point this at a production database.** It gets its own project, its own
   credentials, its own seed data.
2. **Never copy real data in.** No real student names, staff records, phone numbers,
   emails or certificates. Generate plausible fakes.
3. **Fixes flow original → demo, never the reverse.** Make the change in
   `faculty_appraisal_portal`, then re-copy the changed files. Do not develop here.
4. **Assume every visitor is hostile.** Credentials for this app are printed on a
   public portfolio page. Seed only disposable data.

## What was excluded when this copy was made

`node_modules`, `.git`, build output, `.env` / `.env.local`, and every
`.tsv` / `.xlsx` / `*backup*.json` / attachments directory found in the original.
`.env.example` was kept so the required variables are still documented.

Deployment steps: see `DEMOS.md` in the Portfolio repo.
