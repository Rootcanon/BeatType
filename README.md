# BeatType - Keyboard Mania

**Student:** Mian Muhammad Irtaza

**Roll No:** F24BDOCS1M01267

A browser‑based keyboard rhythm game inspired by osu!mania.  
Built with vanilla HTML, CSS, and JavaScript.  
Data is stored in db.json and served by JSON Server.

## Features

### User Panel (index.html)

- Browse, filter, and sort beatmaps
- Play the rhythm game with procedurally generated notes
- Submit scores with inline validation
- View personal stats and recent plays

### Admin Panel (admin.html)

- Dashboard with summary statistics
- Add, edit, delete beatmaps (CRUD)
- Export beatmaps to CSV

## How to Run

1. Install JSON Server globally: `npm install -g json-server`
2. Open a terminal in the project folder
3. Run: `json-server --watch db.json`
4. Open `index.html` in a browser (or use Live Server)
5. For admin panel, open `admin.html`

## Tech Stack

- HTML5, CSS3, JavaScript (vanilla)
- JSON Server (mock REST API)

## Future Improvements

- Make navigation bar buttons functional
- Fix score submission button to return to result screen after submit
- Keep admin panel on “Manage Beatmaps” after add/edit/delete
- Add pre‑designed beatmap patterns (instead of random generation)
- Add other game modes

## Screenshots

![Main page - with user stats, recent play list and beatmaps](./assets/Screenshots/Screenshot%202026-06-14%20211355.png)

![Playing - notes fawling with score, combo and accuracy](./assets/Screenshots/Screenshot%202026-06-14%20210943.png)

![Admin page - Manage Beatmaps](./assets/Screenshots/Screenshot%202026-06-14%20212219.png)
