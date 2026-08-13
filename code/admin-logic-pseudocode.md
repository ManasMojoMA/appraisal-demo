# Admin Logic Pseudocode

## Confirmed configuration change
```ts
async function saveAdminConfigChange({ actor, entityType, oldValue, newValue, reason }) {
  assertUserRole(actor, ["admin", "super_admin"]);
  assert(reason.length > 5, "Reason is required");

  const newVersion = await createNewConfigurationVersion(entityType, newValue);

  await writeAuditLog({
    actorUserId: actor.id,
    actionType: `${entityType}.version_created`,
    entityType,
    entityId: newVersion.id,
    oldValueJson: oldValue,
    newValueJson: newValue,
    reason,
  });

  return newVersion;
}
```

## Faculty category enable
```ts
function enableCategory(submission, categoryKey) {
  submission.enabledCategories.add(categoryKey);

  if (!submission.entriesByCategory[categoryKey]?.length) {
    submission.entriesByCategory[categoryKey] = [createBlankEntry(categoryKey)];
  }

  return submission;
}
```

## Final submission
```ts
async function finalSubmit({ user, cycle, schema, submission }) {
  assertUserRole(user, ["faculty"]);
  assertBeforeDeadlineOrExtension(user.id, cycle.id);

  const issues = validateFacultySubmission(schema, submission);
  if (issues.length) throw new ValidationError(issues);

  await lockSubmission(submission.id);
  await writeAuditLog({
    actorUserId: user.id,
    actionType: "faculty_submission.final_submit",
    entityType: "faculty_submission",
    entityId: submission.id,
  });
}
```

## Prevent faculty rubric leakage
```ts
function getFacultyFormResponse(formTemplate) {
  return stripKeys(formTemplate.schemaJson, [
    "marks",
    "weightage",
    "rubric",
    "score",
    "threshold",
    "penalty",
    "aiPrompt",
    "internalOnly",
  ]);
}
```
