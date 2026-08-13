# API Specification

## Auth
### GET /api/me
Returns current user profile and role.

## Faculty APIs
### GET /api/faculty/cycle
Returns active cycle, deadline, form template version, faculty submission status.

### GET /api/faculty/form
Returns faculty-visible form schema only. Must not include scoring fields.

### POST /api/faculty/submission/draft
Saves draft.

### GET /api/faculty/submission
Returns current user's draft/submitted self-review.

### POST /api/faculty/submission/submit
Validates and final submits. Blocks if deadline has passed and no extension exists.

### POST /api/faculty/evidence/upload
Uploads evidence to storage and returns secure URL.

## Admin configuration APIs
### GET /api/admin/form-template
Returns form configuration and version history.

### POST /api/admin/form-template
Creates new form configuration version.

### PATCH /api/admin/form-template/:id/publish
Publishes selected version.

### GET /api/admin/rubric
Returns hidden rubric configuration.

### POST /api/admin/rubric
Creates new hidden rubric version.

### PATCH /api/admin/rubric/:id/freeze
Freezes rubric version for scoring.

### POST /api/admin/deadline
Creates or updates deadline/extension. Requires audit reason.

## Admin monitoring APIs
### GET /api/admin/submissions/status
Returns faculty submission status dashboard.

### GET /api/admin/submissions/export
Exports faculty self-review data.

### GET /api/admin/audit-logs
Returns audit logs with filters.

## Student feedback APIs
### POST /api/admin/student-feedback/import
Imports CSV and validates rows.

### GET /api/admin/student-feedback/imports
Lists import batches.

### GET /api/admin/student-feedback/errors/:batchId
Shows import errors.

## Evaluation APIs
### POST /api/admin/evaluation/run-ai-assist
Runs AI summarization and scoring assistance for selected faculty/cycle.

### POST /api/admin/evaluation/compute
Computes draft scores using frozen rubric version.

### PATCH /api/admin/evaluation/:id/override
Evaluator override with reason.

### PATCH /api/admin/evaluation/:id/finalize
Finalizes score.

### GET /api/admin/evaluation/export
Exports final evaluation sheet.

## API security rules
- All faculty endpoints must filter by authenticated user ID.
- Admin endpoints require admin or super_admin.
- Evaluation endpoints require evaluator/dean/admin role.
- Hidden rubric config must never be sent to faculty routes.
- All write actions must create audit logs.
