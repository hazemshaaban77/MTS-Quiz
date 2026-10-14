# MTS Training Arena v2 — unified session prototype

## Design and core interaction
- **One room, one QR:** the trainer builds an ordered playlist; trainees join once from `index.html?room=...` and stay there as the current activity changes.
- **Three synchronized surfaces:** `instructor.html`, `index.html`, `screen.html`.
- **Activity engine:** Quiz (fixed 1000 points for correct answer) and opinion Poll (zero points). The trainer has explicit Begin / Reveal / Next controls.
- **Visual design:** dark corporate arena, bright blue/green highlights, motion that respects reduced-motion preferences.
- **Firebase:** uses the existing project config, authenticated trainer room writes, anonymous participant name and answer writes. Trainer stores the full playlist locally; only the current question is published to the room. Correct Quiz choice is published only at reveal.

## Important limitations — not production ready
1. This is the FIRST unified foundation, not the finished platform. Order It, Match It, Categorize, Team Battle, import/export, global session history, persistent multi-device trainer editing and fully customizable scoring are not yet built.
2. The trainer's activity playlist is local to the trainer browser; don't clear browser storage during a session. The active room is stored in localStorage for reload recovery.
3. Current Firebase database rules from the earlier application permit an authenticated participant to send an answer for a future activity index; server-side phase/range checks must be implemented and tested. No backend-authoritative scoring yet.
4. Trainee reconnect on a different browser/device cannot restore the same anonymous Firebase UID without an explicit identity recovery mechanism.
5. Preview uses the same production Firebase database; test with disposable room codes and test accounts only.
6. A live cross-device integration test has NOT been executed. Syntax validation alone is not enough to establish function or security.

## Acceptance test
1. Open `preview-v2/instructor.html` and sign in as your approved trainer account.
2. Create one Quiz and one Poll, reorder them, start the room.
3. Open projector from instructor, join on two different phone/browser profiles via the SINGLE QR code.
4. Verify both participants stay in the room as the trainer starts Quiz, reveals results, and advances to Poll.
5. Quiz should award 1000 points for the correct answer; Poll should show vote counts without scoring.
6. Verify that the trainee app advances without another QR scan and that the projector keeps pace.
7. Reload the trainee page in the same browser after a confirmed answer. Verify answer is still locked.
8. Reload the instructor tab without clearing localStorage. Verify active session and playlist recover.
9. Close the session and confirm room, answers, and ID reservation paths are deleted.
10. Validate Rules in Firebase Emulator with malicious/out-of-phase writes and identity collisions before rolling out to real training.
