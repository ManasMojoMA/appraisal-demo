# PRD — Faculty Performance Appraisal Portal

## Product name
Faculty Performance Appraisal Portal

## Purpose
Create a secure self-review and internal evaluation platform for faculty performance appraisal. The platform must collect structured faculty self-review data under Service Contribution, Research Performance, Academic Delivery, and Innovation in Pedagogy. It must also allow the internal team to combine faculty-submitted data with student feedback and other verified data to generate final appraisal scores.

## Problem
Faculty appraisal currently requires multiple fragmented data sources: student feedback, self-appraisal claims, research evidence, service contribution evidence, program office verification, and dean/evaluator moderation. Manual compilation creates delays, inconsistency, missing evidence, and difficulty in Excel/Google Sheets-based evaluation.

## Target users
### Faculty
Submit annual self-review with evidence. Faculty should not see internal marks, rubrics, weightage, scoring rules, student feedback scores, or final score logic.

### Admin team / Program office
Manage form content, deadlines, imports, verification, exports, and rubric configuration.

### Evaluator / Dean
Review evidence, use AI-assisted summaries, moderate scores, and finalize appraisal output.

### Super admin
Control admin access, final rubric freeze, irreversible changes, and audit review.

## Appraisal coverage
- Annual appraisal cycle
- Two semesters of teaching delivery
- Annual research output
- Annual service contribution
- Student feedback imported separately
- Program office verification
- Dean/evaluator moderation

## Core modules
1. Public landing page
2. Faculty login
3. Faculty self-review dashboard
4. Dynamic category-based self-review form
5. Draft autosave and final submission
6. Evidence management
7. Admin configuration console
8. Deadline management
9. Student feedback import module
10. Internal evaluation engine
11. AI-assisted evidence review
12. Export to CSV/XLSX/Google Sheets
13. Audit logs and versioning

## Success criteria
- Faculty can complete and submit self-review without seeing confidential evaluation logic.
- Admin can change form content and rules without developer dependency.
- Internal team can export clean structured data for Excel/Google Sheets.
- Evaluation logic can be altered by admin and versioned.
- Student feedback can be imported and merged with faculty self-review.
- Every admin change is auditable.
- Old submissions remain tied to the form/rubric version active at the time of submission.
