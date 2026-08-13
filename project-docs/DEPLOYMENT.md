# Deployment Plan

## Environments
1. Local development
2. Staging/UAT
3. Production

## Recommended deployment
- Vercel for Next.js app
- Supabase for database/auth/storage
- GitHub repository
- Environment variables managed in Vercel dashboard

## Deployment checklist
### Before deployment
- Run linting and type checks.
- Run form validation tests.
- Test role access manually.
- Verify faculty cannot access admin APIs.
- Verify hidden rubric is not in frontend bundle.
- Test file upload and signed URL access.
- Test CSV import and export.
- Test deadline block.
- Test admin audit logs.

### Environment variables
```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
AI_PROVIDER=
GEMINI_API_KEY=
OPENAI_API_KEY=
APP_URL=
```

## Backup plan
- Daily database backup.
- Export all final appraisal data after cycle closure.
- Archive form version, rubric version, and final evaluation export.

## Launch sequence
1. Configure form in staging.
2. Test with 3–5 faculty dummy accounts.
3. Test admin config changes.
4. Freeze rubric version.
5. Import sample student feedback.
6. Run dummy evaluation.
7. Fix issues.
8. Move to production.
9. Open submission window.
10. Monitor submissions daily.

## Post-launch monitoring
- submission completion rate
- validation error patterns
- evidence upload failures
- admin config changes
- late submissions/extensions
- import failures
- export errors
