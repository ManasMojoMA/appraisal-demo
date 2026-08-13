# Audit Log Specification

## Purpose
Maintain a reliable, immutable trail of all important actions, especially actions by multiple admins.

## Events to log
### Faculty events
- login
- draft created
- draft autosaved
- evidence uploaded
- entry added
- entry deleted
- category enabled/disabled
- final submission

### Admin events
- form title changed
- instructions changed
- category changed
- field changed
- mandatory status changed
- deadline changed
- extension granted
- form version published
- rubric changed
- rubric frozen
- student feedback imported
- data exported
- submission reopened

### Evaluator events
- evidence verified/rejected
- AI assistance run
- score generated
- score overridden
- final score locked
- moderation note added

## Audit log fields
- id
- actor_user_id
- actor_name
- actor_role
- action_type
- entity_type
- entity_id
- old_value_json
- new_value_json
- reason
- ip_address
- user_agent
- created_at

## Immutability rules
- Audit logs cannot be edited.
- Audit logs cannot be deleted through normal UI.
- Super admin can archive logs only through database-level archival process.

## Admin confirmation workflow
For sensitive changes:
1. Admin clicks save.
2. System shows impact summary.
3. Admin checks confirmation box.
4. Admin enters reason.
5. System creates new config version.
6. System writes audit log.
7. Old submissions remain linked to old version.

## Sensitive actions needing confirmation
- field deletion/disabling
- mandatory logic change
- deadline change
- rubric change
- AI prompt change
- form publish
- rubric freeze/unfreeze
- evidence verification reversal
- evaluator score override
- final score unlock
