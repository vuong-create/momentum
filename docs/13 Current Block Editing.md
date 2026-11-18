# Current Block: actual training

Current Block is an editable calendar of individual training sessions. Build / Edit Block remains the weekly design. Editing a calendar occurrence must not change other weeks or the reusable template.

- Drag a session to another day, or open it and choose Move to date. Destinations must be inside the block's inclusive start/end dates.
- Moving a completed session corrects its Planner schedule, completion date, activity event date and existing XP date. It preserves the original logging timestamp and XP identity/amount; it does not award XP again.
- Moving an unfinished session does not complete it. Exercise prescriptions remain unchanged when moving between training weeks.
- Add session can reuse a workout from the template or create a one-off workout, volleyball session or custom activity. Multiple sessions may share a day. An optional already-completed checkbox records past sessions on their selected date.
- Delete removes only that occurrence and its linked Planner task. Deleting a completed occurrence also voids its completion/XP credit. Confirmation and the existing short-lived Undo restore the original records, without creating a second award.
- Manual occurrence overrides reserve their original template slots, including deleted occurrences, so applying the weekly design does not recreate them. New one-offs are excluded from reconstruction of the weekly design.
- Calendar edits are atomic database transactions. No automatic rewrite of existing user data is performed on startup.

Optional session metadata: manualOverride, templateWeekNumber, templateDate. These require no new database index and are included in existing backups. Tests use isolated databases, never daily-driver data.
