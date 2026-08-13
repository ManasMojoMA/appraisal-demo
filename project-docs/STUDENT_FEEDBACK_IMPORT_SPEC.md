# Student Feedback Import Specification

## Purpose
Student feedback is collected through a separate source and imported into the internal evaluation system. It is not collected from faculty and must not be visible in the faculty self-review form.

## Data source
Possible sources:
- Google Forms / Google Sheets
- LMS export
- Student feedback portal
- Manually prepared CSV

## Required import columns
| Column | Required | Description |
|---|---:|---|
| faculty_id | Yes | Internal faculty identifier |
| faculty_email | Yes | Used for matching if ID unavailable |
| faculty_name | Yes | Display and verification |
| appraisal_cycle | Yes | Example: 2025-26 |
| programme | Yes | MBA/BBA/etc. |
| semester_or_term | Yes | Semester/term |
| course_code | No | If available |
| course_name | Yes | Course evaluated |
| section | Yes | Section/batch |
| feedback_round | Yes | Mid-course or End-course |
| average_score_5 | Yes | Average on 1–5 scale |
| response_count | Yes | Number of student responses |
| source_file | No | Name/link of source import |

## System processing
1. Validate required columns.
2. Match faculty by `faculty_id` first; fallback to email.
3. Validate average score is between 1 and 5.
4. Convert average score into internal marks using active rubric bands.
5. Average multiple course/section records as configured.
6. Store original data and processed score separately.
7. Mark import as versioned and auditable.

## Faculty visibility
Faculty should not see the imported student feedback marks or conversion bands.

## Import error handling
Show admin:
- missing faculty match
- invalid score
- missing required column
- duplicate course-section record
- response count below configured threshold

## Export fields after processing
- faculty_id
- faculty_email
- course_code
- course_name
- section
- feedback_round
- average_score_5
- response_count
- converted_marks
- conversion_band
- import_batch_id
