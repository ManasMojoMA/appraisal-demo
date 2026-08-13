# Admin Console Specification

## Admin dashboard sections
1. Appraisal cycles
2. Form builder
3. Category and field configuration
4. Deadline management
5. Faculty submission monitoring
6. Student feedback import
7. Internal rubric and evaluation configuration
8. AI evaluation settings
9. Export center
10. Audit logs
11. User and role management

## 1. Appraisal cycle management
Admin can create cycles such as:
- Appraisal Cycle 2026
- Academic Year 2025–26
- Semester pair: Odd + Even

Cycle fields:
- cycle name
- start date
- end date
- faculty submission open date
- faculty submission deadline
- status: draft, open, closed, evaluation, finalized, archived

## 2. Form builder
Admin can edit faculty-visible content:
- form title
- form description
- instructions
- category names
- category descriptions
- field labels
- placeholders
- help text
- options
- mandatory status
- visibility logic
- display order

Admin can create configuration versions. A submitted response must remain tied to the form configuration version active when it was submitted.

## 3. Field logic controls
Admin can define:
- required/optional
- show/hide conditions
- accepted file types
- max file size
- allowed date range
- URL required or optional
- dependent fields
- min/max number of entries

## 4. Deadline controls
Admin can set:
- global deadline
- department/programme deadline override
- individual faculty extension
- grace period
- reopen window with reason

When deadline passes:
- drafts remain visible but cannot be submitted
- admin can export non-submission report
- extension must be logged with reason

## 5. Submission monitoring
Admin can see:
- total faculty
- not started
- draft started
- submitted
- submitted after extension
- evidence missing flag
- category completion summary

Admin cannot silently alter faculty submission content. If correction is required, reopen to faculty or add admin verification note.

## 6. Student feedback import
Admin can import CSV/Google Sheet data with:
- faculty identifier
- course code
- semester
- section
- average score on 5-point scale
- mapped teaching marks
- feedback count
- data source

The faculty must not see this imported data.

## 7. Internal rubric configuration
Admin/super admin can manage hidden evaluation logic:
- component names
- max marks
- category mappings
- thresholds
- negative marking logic
- score conversion bands
- AI evaluation prompts
- human override rules

System must validate:
- total active rubric weight equals 100 or admin-approved exception exists
- every component has max marks
- rubric version is frozen before final scoring

## 8. Irreversible change confirmation
Before any admin changes form schema, rubric, deadline, or AI logic, show modal:

> Are you sure you want to make this change? This will create a new configuration version and cannot be directly overwritten. Existing submissions will remain linked to their previous version.

Require:
- checkbox confirmation
- optional reason/comment
- re-authentication for super-sensitive changes

## 9. Audit log viewer
Admin/super_admin can filter logs by:
- admin user
- action type
- date range
- affected module
- affected faculty
- old value/new value
- IP/device/session

## 10. Export center
Exports:
- Faculty self-review raw data
- Faculty category-wise flattened data
- Evidence link report
- Submission status report
- Student feedback import data
- Internal evaluation report
- Final appraisal score sheet
- Audit logs

Export formats:
- CSV
- XLSX
- Google Sheets-ready CSV

## 11. Admin UX safeguards
- Preview faculty form before publishing.
- Draft configuration before publish.
- Version history and rollback by creating new version from old version.
- Do not mutate old submitted records.
- Warn if changing active form during open submission window.
- Warn if rubric total is not valid.
- Show data impact before deletion/disabling.
