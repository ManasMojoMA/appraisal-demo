# Architecture

## High-level architecture
```
Faculty Browser
  ↓
Next.js Faculty UI
  ↓
Faculty API Layer — returns only faculty-visible schema/data
  ↓
PostgreSQL/Supabase — faculty submissions + evidence references
```

```
Admin Browser
  ↓
Next.js Admin UI
  ↓
Admin API Layer — config, imports, evaluation, audit
  ↓
PostgreSQL/Supabase + Storage
  ↓
Optional AI Provider for internal evaluator-assist only
```

## Separation of concerns
### Faculty layer
- form display
- draft save
- validation
- evidence upload
- final submit

### Admin layer
- form configuration
- deadlines
- imports
- verification
- rubric configuration
- audit logs

### Evaluation layer
- hidden scoring
- student feedback merge
- AI summarization
- evaluator override
- final export

## Configuration versioning
Every form/rubric change creates a new version.
Submissions store:
- form_template_id
- rubric_version_id used during evaluation

## AI architecture
AI must be server-side only.
Inputs:
- faculty entries
- evidence metadata
- rubric component definitions
- verification status

Outputs:
- summary
- evidence quality
- flags
- recommended band
- missing information

AI must not directly finalize score.

## Export pipeline
1. Read submissions.
2. Flatten category entries.
3. Merge student feedback.
4. Merge internal evaluations.
5. Generate CSV/XLSX.
6. Log export event.

## Deployment architecture
- Vercel: Next.js app.
- Supabase: database/auth/storage.
- Optional background jobs: Vercel cron, Supabase edge functions, or serverless worker.
