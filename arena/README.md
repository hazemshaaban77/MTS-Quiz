# MTS Training Arena — Foundation Preview

This is an **isolated, locally functional design and authoring prototype**, developed on the `feature/mts-training-arena-foundation` branch of the existing MTS-Quiz repository. Existing production files remain untouched.

## Run
Open `arena/index.html` in a browser (or serve `arena/` with a simple static web server). The **Enter Preview** button is explicitly *not* authentication. Draft sessions are stored in that browser's localStorage only.

## Working now
- Responsive trainer login concept and Smart Dashboard
- Arabic/English interface toggle (author-entered text is not translated)
- Session draft creation, rename, deletion, and automatic local save
- Activity catalog of all eleven approved activity types
- Functional simple Quiz, Live Poll and single Dropdown question authoring
- Questions and options editing with stage preview
- Draft activity reordering and preview-only projection screen

## Not yet implemented
Production Firebase authentication, realtime rooms and one-QR enrollment, security rules, multiple trainers, teams, scoring, answer collection, nesting, all 11 game engines, reports, lifecycle automation and production deployment. **Do not use preview for actual participant data or training results.** Reuse of current Firebase project requires a separate security and capacity review before integration.

## Free-tier planning
GitHub Pages can serve these static assets. Realtime Database Spark has a limit of 100 simultaneous connections *including trainers and projector devices*. No assumption is made about the feasibility of supporting 100 trainees. No server secrets should ever be put in this repository.

## Safety
This prototype never writes to Firebase. Original legacy pages and their Firebase configuration are unmodified.
