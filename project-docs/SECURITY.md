# Security Requirements

## Data confidentiality
Faculty must never access:
- hidden rubric
- scoring logic
- student feedback marks
- evaluator notes
- AI scoring prompt
- final internal score unless explicitly released
- audit logs

## Authentication
- Use institutional SSO or secure email login.
- Enforce strong session management.
- Require re-authentication for super admin irreversible changes.

## Authorization
Use strict role-based access control:
- faculty
- admin
- super_admin
- evaluator/dean

Every API route must check role and ownership.

## Database security
- Enable Row Level Security if using Supabase.
- Faculty can only read/write own submission.
- Rubric and evaluation tables are admin/evaluator only.
- Audit logs are immutable.

## Input validation
- Use Zod validation on server.
- Validate URLs.
- Validate file types and file sizes.
- Validate dates against appraisal cycle.
- Validate required fields for enabled categories.
- Validate imported CSV columns and values.

## File security
- Store evidence in protected storage.
- Generate signed URLs for authorized users.
- Scan file type if possible.
- Do not allow executable files.

## Audit requirements
Log:
- admin configuration changes
- rubric changes
- deadline changes
- imports
- exports
- evaluator overrides
- finalization
- faculty submission
- reopen actions

## AI security
- AI API keys server-side only.
- Do not send unnecessary personal data to AI.
- Do not allow AI output to auto-finalize scores.
- Store AI summaries as advisory records.
- Add disclaimer in admin UI: AI output is an internal aid and requires human verification.

## Irreversible change safeguard
Sensitive admin changes require:
- confirmation modal
- reason/comment
- version creation
- audit log
- optional re-authentication

## Common vulnerabilities to prevent
- IDOR: faculty accessing another faculty submission
- client-side hidden rubric leakage
- CSV injection in exports
- SQL injection
- unrestricted file upload
- unlogged admin changes
- silent mutation of old submissions
- accidental exposure of AI prompt/rubric in frontend bundle
