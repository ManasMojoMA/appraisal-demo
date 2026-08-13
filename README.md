# Faculty Appraisal Portal — public demo

A confidential faculty self-review and internal appraisal platform, running as a
public demo with invented data.

The interesting property is that **the same appraisal cycle looks different to
four different people**, and that asymmetry is the product:

- **Faculty** fill in a self-review and attach evidence. They never see the
  rubric they are being scored against, the student-feedback numbers, the
  weightings, or their final score — unless an admin explicitly releases it.
- **Evaluators** score submissions against that hidden rubric.
- **Deans** moderate across evaluators, where the point is catching a scorer who
  runs consistently harsh or soft, and finalise the cycle.
- **Admins** open cycles, build the form templates, version rubrics, set
  deadlines and grant per-person extensions.

A single shared login would hide all of that, which is why the demo offers one
button per role instead.

## Try it

Four **Explore as …** buttons on the login screen. No credentials to type, and
none published anywhere.

Worth doing in this order: sign in as Faculty and submit a self-review, then as
Evaluator and score it against the rubric, then as Dean and watch the moderation
view compare that evaluator against the others.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Data | PostgreSQL via Prisma — 13 models, 15 foreign keys |
| Auth | Firebase Auth (email/password) |
| Hosting | Vercel |

Postgres rather than a document store is a deliberate choice: cycle → template →
submission → entries → evaluation → rubric version is relational all the way
down, and moderation means reading across all of it at once.

## Demo restrictions

Everything is editable — cycles, templates, submissions, rubrics, evaluations,
deadlines — **except account management**. Creating, deleting and re-roling users
is frozen, and enforced server-side rather than by hiding buttons.

The reason: the role logins are public, so anyone holds an admin session. Left
open, a visitor could create a `super_admin` under an address they control, which
would survive every password rotation, or delete the demo accounts and break the
demo for everyone after them. The invented appraisal data was never what was at
risk; the accounts are.

## Design docs

`project-docs/` holds the specs this was built from — PRD, database design, the
internal evaluation engine, the audit-log spec, and the security model.

## Note

This is a sanitised copy built for public display. It shares no data, backend or
credentials with any real deployment, and every name, score and appraisal record
in it is invented.
