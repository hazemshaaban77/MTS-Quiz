# Phase 3 — Live Poll (first activity)

## Included
- `poll-instructor.html`: trainer signs in, creates a poll, starts voting, reveals aggregated results, and deletes a session.
- `poll.html?room=<code>`: participants join by name and employee ID, cast one vote, and see results after the trainer reveals them.
- `poll-screen.html?room=<code>`: a projector page showing the QR code, voting phase, then result bars.
- `preview-phase3/` on main: GitHub Pages preview copies, with relative asset paths adjusted.

## How to verify
1. Open `preview-phase3/poll-instructor.html`, log in with instructor Firebase account and create a poll with at least 2 choices.
2. Scan the QR code using two different devices (or independent browser profiles).
3. Ensure the two trainee names appear in Firebase room players and that each can vote once.
4. Check the projector hides vote percentages while voting is open.
5. Reveal results as trainer. Check each option count and percentages on trainer, trainee, and projector.
6. Reload a trainee page after successful vote and ensure it stays selected on the same browser.
7. End poll. Check the three Firebase nodes for that room are deleted and room links show an unavailable message.
8. Test Arabic, long questions, mobile viewport, lost connection, and an invalid/duplicate employee ID.
9. Use the Firebase Emulator or Rules Playground to confirm unauthorized writes are blocked.

## Known limits / follow-up
- This is a standalone first activity in Phase 3; unified activity catalogue, reusable poll templates, live export, Order It, Match It, Categorize, and Dropdown are not implemented here.
- Each session is one question and participants' votes are anonymous in the public aggregate.
- Poll option counts are computed by the instructor on reveal, not by a trusted server. Rules should eventually constrain answer indices, room phase, and voting deadlines. Check live permissions before production.
- Only source-level syntax checks have run. **Live multi-device and Firebase Rules tests have not run**, so preview is for testing only.
