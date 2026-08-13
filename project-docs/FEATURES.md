# Feature Specification

## 1. Landing page
- Institutional hero section with particle text effect.
- Clear CTA: Faculty Login, Admin Login.
- Brief explanation of the self-review process.
- No public display of scoring or internal evaluation logic.
- Brand colors inspired by university logo.

## 2. Authentication and roles
- Secure login.
- Role-based access: faculty, admin, super_admin, evaluator/dean.
- Faculty can access only their own forms.
- Admins can access configuration and imports.
- Evaluators can access scoring and review modules.

## 3. Faculty dashboard
Faculty sees:
- Current appraisal cycle
- Submission deadline
- Draft/submitted status
- Enabled categories
- Completion progress
- Evidence completion status
- Submit button only when validation passes

Faculty does not see:
- marks
- scoring
- weightage
- student feedback score
- evaluator notes
- AI scoring logic

## 4. Category activation
Each category has an enable/add control.
When enabled:
- one default entry is created automatically
- at least one entry is mandatory
- every mandatory field inside that entry must be completed

Faculty can:
- add additional entries
- delete additional entries
- save draft
- submit after validation

Faculty cannot:
- submit a category with a partially filled added entry
- remove the only entry from an enabled category unless they disable the category
- edit final submitted form unless admin reopens it

## 5. Service Contribution section
Fields:
- Position of responsibility
- Contribution type
- Task/responsibility handled
- Action taken
- Result/impact
- Stakeholders benefited
- Date range
- Evidence link/upload
- Remarks

## 6. Research Performance section
Fields:
- Type of research
- Title of research
- Publication/completion date
- Publication link
- Research document/evidence link
- Journal/publisher/conference/project/patent details
- DOI/ISBN/application number
- Co-authors/collaborators
- Status
- Remarks

## 7. Academic Delivery section
Fields:
- Course name and code
- Programme, semester, section
- Course outline/session plan shared
- Syllabus completion status
- LMS usage/resources uploaded
- Lesson planning evidence
- Case/examples/application integration
- Assessment and feedback timeliness
- Student support/remedial actions
- Evidence link/upload
- Remarks

## 8. Innovation in Pedagogy section
Fields:
- Innovation type
- Activity/title
- Course/programme/section
- Method description
- Date/range
- Student participation level
- Industry/external partner, if any
- Learning outcome/impact
- Evidence link/upload
- Remarks

## 9. Deadline management
- Global deadline.
- Programme/department-specific deadline override.
- Individual faculty extension.
- Grace period option.
- Deadline banner on faculty dashboard.
- Deadline changes logged.

## 10. Admin configuration
Admin can manage:
- form title
- instructions
- category description
- field label/help text/options
- mandatory status
- category logic
- field visibility conditions
- internal evaluation rubric
- AI prompt logic
- import templates
- deadlines

Every change creates a version and audit log.

## 11. Internal evaluation
- Import student feedback data.
- Merge faculty self-review with verified program office data.
- Use hidden rubric configuration.
- Run AI assistance for summary and evidence checks.
- Allow evaluator score override.
- Export final evaluation sheet.

## 12. Audit logs
Track:
- login
- draft save
- final submit
- admin config change
- deadline change
- rubric change
- import
- export
- evaluator override
- score finalization
