# Quiz Arena — Phase 2 QA checklist

This is a staging branch. Do not merge until a live three-device session has passed.

## Features changed
- Trainer setup: choose fixed scoring (1000/correct) or speed-weighted scoring (500–1000/correct).
- Trainer setup: reveal results automatically, or manually.
- Trainer setup: advance after result manually, or after 5/10/15 seconds.
- Trainee: wait for Firebase write success before saying the answer was submitted.
- Trainee: retain confirmed answer on same device when refreshing; reset cached selection on a new round.

## Manual end-to-end checks
1. Sign in using instructor.html and start a room with two test questions.
2. Join from two phones with unique employee IDs; verify both appear on projector.
3. Answer correctly on one and incorrectly on the other. Verify score and answer counts.
4. Repeat with fixed scoring and speed scoring.
5. Repeat with auto reveal disabled; confirm score does not show until trainer presses Reveal.
6. Set 5-second automatic advance; verify it advances once and ends at final question.
7. Reload one phone after receiving answer confirmation; verify it stays locked to its saved choice.
8. Disconnect the other phone and reconnect; verify room state, timer, and leaderboard.
9. Refresh instructor and use Resume session; verify timer and auto-advance stay consistent.
10. Reload projector and confirm display matches current room phase.
11. End room, reuse room code, and verify previous cached answers do not lock new round.
12. Verify CSV export and two tied scores, and test Arabic/English layout.

## Firebase security checks before production
Rules supplied in chat allow an authenticated player to write an answer at `ans/$room/$q/$uid` with no rule checking that the room is in question phase, that `$q` is the current question, that `k` is inside the option range, or that the submission is before the deadline. Add these restrictions and test in the Firebase Emulator or Rules Playground before deploying. Do not overwrite the current rules blindly. Existing rules also allow any authenticated user to read whole room records: assess whether this matches privacy expectations.

## Validation performed
- JavaScript inline source syntax checks for instructor, index, screen.
- Checked changed source against expected code anchors.
- No live Firebase room/device interaction has been performed.
