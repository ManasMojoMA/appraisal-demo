# UI/UX Direction

## Design personality
Professional, premium, institutional, confident, and modern. The interface should feel like a serious university system, not a generic AI-generated SaaS template.

## Brand palette derived from uploaded logo
| Token | Hex | Usage |
|---|---|---|
| Deep Crimson | `#930202` | Primary brand, headers, active states |
| University Red | `#E3120B` | CTA, highlights, warning accents |
| Saffron Orange | `#FB8E07` | Gradients, progress states |
| Warm Gold | `#F9C205` | Positive highlights, micro accents |
| Sky Blue | `#3EBDFA` | Links, info states, secondary accents |
| Deep Navy | `#08111F` | Dark backgrounds, admin dashboard |
| Warm White | `#FFFDF7` | Main background |
| Slate Ink | `#111827` | Body text |

## Landing page
Use particle text effect with institutional phrases:
- Faculty Appraisal
- Self Review
- Academic Delivery
- Research Impact
- Service Contribution
- Innovation

Landing page sections:
1. Hero with animated particle text.
2. Short institutional statement.
3. Two CTAs: Faculty Login, Admin Login.
4. Process cards: Draft → Evidence → Submit → Review.
5. Confidentiality note: “Internal evaluation details are handled securely by authorized reviewers.” Do not mention marks.

## Faculty dashboard UX
- Left sidebar: Dashboard, Self Review, Evidence, Submission History, Help.
- Top banner: active cycle, deadline countdown, draft/submitted status.
- Progress card: category completion percentage.
- Category cards with enable/add buttons.
- Inline validation with clear messages.
- Autosave indicator: “Saved just now”.
- Final submit requires confirmation.

## Form UX
- Use accordion or stepper layout.
- Each category has description and status chip.
- Entry cards labelled Entry 1, Entry 2, etc.
- Add entry button at bottom of category.
- Delete entry button for additional entries.
- Do not allow deletion of the only entry unless category is disabled.
- Show evidence upload/link component clearly.

## Admin UX
- Darker premium dashboard style.
- Configuration pages should use version cards.
- Rubric editor should be hidden under admin/evaluator routes.
- Show audit panel with filters.
- Show warning badges for active window changes.
- Any irreversible change must have a confirmation modal.

## Accessibility
- Keyboard navigable.
- Proper labels and error messages.
- Sufficient contrast.
- Reduced motion option for particle animation.
- Mobile responsive.

## Microcopy style
Use formal but clear language. Avoid generic AI-style headings. Keep faculty-facing text simple and direct.
