# Database Design

## Design principles
- Separate faculty-visible submissions from admin-only evaluation records.
- Store form versions and rubric versions separately.
- Never mutate old submitted records.
- Keep audit logs immutable.
- Store imported student feedback separately from final computed scores.

## Main tables

### users
Stores all users.
- id
- name
- email
- role
- department
- employee_code
- status
- created_at
- updated_at

### appraisal_cycles
- id
- name
- academic_year
- start_date
- end_date
- submission_open_at
- submission_deadline_at
- status
- created_by
- created_at

### form_templates
- id
- cycle_id
- version
- title
- description
- instructions
- is_active
- created_by
- created_at

### form_categories
- id
- form_template_id
- key
- label
- description
- display_order
- faculty_visible
- is_active

### form_fields
- id
- category_id
- key
- label
- field_type
- help_text
- placeholder
- options_json
- validation_json
- required
- display_order
- visibility_logic_json

### faculty_submissions
- id
- cycle_id
- faculty_id
- form_template_id
- status: draft/submitted/reopened/locked
- submitted_at
- reopened_at
- reopened_by
- reopen_reason
- created_at
- updated_at

### submission_entries
- id
- submission_id
- category_key
- entry_index
- data_json
- evidence_json
- verification_status
- admin_verification_note
- created_at
- updated_at

### evidence_files
- id
- submission_entry_id
- file_url
- file_name
- file_type
- file_size
- uploaded_by
- uploaded_at

### student_feedback_import_batches
- id
- cycle_id
- file_name
- imported_by
- imported_at
- status
- error_summary_json

### student_feedback_records
- id
- import_batch_id
- cycle_id
- faculty_id
- faculty_email
- programme
- semester_or_term
- course_code
- course_name
- section
- feedback_round
- average_score_5
- response_count
- converted_marks
- conversion_band
- raw_row_json

### rubric_versions
- id
- cycle_id
- version
- name
- config_json
- is_active
- is_frozen
- created_by
- created_at

### evaluation_runs
- id
- cycle_id
- rubric_version_id
- run_type: draft/final
- started_by
- started_at
- completed_at
- status

### faculty_evaluations
- id
- evaluation_run_id
- faculty_id
- submission_id
- teaching_student_feedback_marks
- academic_delivery_marks
- innovation_marks
- research_marks
- service_marks
- penalty_marks
- final_score
- ai_summary_json
- evaluator_notes
- dean_moderation_notes
- final_status
- finalized_by
- finalized_at

### audit_logs
- id
- actor_user_id
- action_type
- entity_type
- entity_id
- old_value_json
- new_value_json
- reason
- ip_address
- user_agent
- created_at

### deadline_overrides
- id
- cycle_id
- faculty_id
- override_deadline_at
- reason
- approved_by
- created_at

## Indexes
- users.email unique
- users.employee_code unique nullable
- faculty_submissions(cycle_id, faculty_id) unique
- submission_entries(submission_id, category_key)
- student_feedback_records(cycle_id, faculty_id)
- audit_logs(actor_user_id, created_at)
- audit_logs(entity_type, entity_id)

## Row-level access rules
- Faculty can read/write only their own draft before deadline.
- Faculty can read own submitted content.
- Faculty cannot read rubric, evaluation, student feedback, or audit logs.
- Admin can read submissions and configs.
- Evaluator can read submissions and evaluation records.
- Super admin can manage all configuration.
