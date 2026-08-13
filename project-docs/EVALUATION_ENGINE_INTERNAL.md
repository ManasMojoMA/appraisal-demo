# Internal Evaluation Engine Specification

## Confidentiality
This file contains internal evaluation logic. It must never be rendered in any faculty-facing page or API response.

## Important policy implementation note
The uploaded policy establishes a broad appraisal structure across Teaching, Research, and Service and also contains detailed subcomponents. However, the broad 100-mark structure and the detailed subcomponent totals need admin confirmation before launch. Therefore, the system must implement a versioned, admin-editable rubric rather than hardcoding a single formula in the UI.

## Recommended hidden default rubric version
The default below aligns with the broad 100-mark structure while keeping the detailed categories operational. Admin may edit before launch.

| Component | Max Marks | Input Source | Faculty Visible? |
|---|---:|---|---:|
| Teaching — Student Feedback | 30 | Imported student feedback | No |
| Teaching — Academic Delivery | 15 | Faculty self-review + evidence + verification | Self-review only; marks hidden |
| Teaching — Innovation | 5 | Faculty self-review + evidence + verification | Self-review only; marks hidden |
| Research Performance | 25 | Faculty self-review + evidence + verification | Self-review only; marks hidden |
| Service Contribution | 25 | Faculty self-review + evidence + verification | Self-review only; marks hidden |
| Penalty | Configurable deduction | Admin/internal data | No |
| Final Score | 100 minus penalty | Evaluation engine | No unless released |

## Alternative raw-policy mode
Admin may configure the system exactly according to a policy document version. If raw detailed marks do not total 100, system must show admin warning and require super_admin approval before scoring.

## Student feedback conversion
Student feedback is imported separately. The faculty self-review form must not ask faculty to enter student feedback.

Suggested default conversion:
| Average on 5-point scale | Teaching feedback marks |
|---|---:|
| 4.50–5.00 | 30 |
| 4.20–4.49 | 25 |
| 4.00–4.19 | 20 |
| 3.50–3.99 | 15 |
| Below 3.50 | 5 |

Admin must be able to edit these bands.

## Evaluation workflow
1. Faculty submits self-review.
2. Program office verifies evidence.
3. Student feedback is imported.
4. AI assistant generates a summary and evidence quality flags.
5. Evaluator reviews entries and AI suggestions.
6. Evaluator assigns/accepts/modifies internal scores.
7. Dean/evaluator moderation is added.
8. Final score is locked.
9. Export is generated.

## Evidence verification status
Each entry should have internal status:
- not_reviewed
- verified
- partially_verified
- evidence_missing
- rejected
- clarification_required

Faculty may see only clarification requests if admin chooses to send them. Faculty should not see marks.

## AI evaluator-assist output
AI output must be advisory, not final. Human evaluator can override.

AI should return JSON:
```json
{
  "summary": "Brief evidence-based summary",
  "evidence_quality": "strong | moderate | weak | missing",
  "impact_level": "high | medium | low | unclear",
  "risk_flags": ["duplicate_claim", "missing_evidence", "unclear_impact"],
  "recommended_score_band": "high | medium | low | no_score",
  "reasoning_for_evaluator": "Why this band is suggested",
  "missing_information": ["List of missing items"]
}
```

## AI prompt guardrails
- Do not fabricate evidence.
- Do not assign final marks unless explicitly asked by admin workflow.
- Do not reward quantity without evidence or impact.
- Highlight missing proof.
- Highlight duplicate or repeated claims.
- Summarize in institutional and professional language.
- Use configured rubric version only.

## Penalty logic
Penalty is hidden from faculty. Admin can configure penalty source and cap.
Default draft:
- penalty type: substitution sessions
- deduction: 1 mark per session
- cap: 20 marks
- source: admin-imported substitution records

## Final formula
Final Score = Teaching Score + Research Score + Service Score - Penalty

The formula and components must be pulled from the active rubric version.

## Excel/Google Sheets export design
The export should include both raw and computed columns:
- faculty_id
- faculty_name
- department
- cycle_id
- teaching_student_feedback_marks
- academic_delivery_internal_marks
- innovation_internal_marks
- research_internal_marks
- service_internal_marks
- penalty_marks
- final_score
- evaluator_notes
- dean_moderation_notes
- final_status
- rubric_version

## Loophole prevention
- Do not allow faculty to edit after final submission.
- Lock evidence timestamps at submission.
- Store form version and rubric version separately.
- Detect duplicate evidence links used across multiple entries.
- Flag date outside appraisal cycle.
- Require evidence for high-impact claims.
- Maintain immutable audit logs.
- Human evaluator must finalize AI-suggested scores.
- Admin changes after deadline must create new versions and not mutate past results.
