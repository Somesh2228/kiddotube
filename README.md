# KiddoTube

KiddoTube is a colorful static web app for kids that combines learning videos, short reels, animal and alphabet pages, quizzes, and mini-games in one playful interface.

It is built with plain HTML, CSS, and JavaScript, so it can be opened locally or hosted easily on GitHub Pages, Netlify, Vercel, or any basic static hosting service.

## Features

- Kid-friendly landing page and app-style home screen
- Learning sections for ABC, numbers, animals, Marathi vowels, and Marathi consonants
- Long videos and reels with custom scrolling behavior
- Local media support through the `videos/` and `sounds/` folders
- Profile, login, and upload pages
- Games hub with standalone game pages:
  - `Puzzle Pals`
  - `Memory Match 15`
  - `Balloon Pop Party`
  - `Shape Match`
- Shared navbar and responsive layouts for desktop and mobile

## Project Structure

```text
kiddotube/
├─ app.html
├─ index.html
├─ Learn.html
├─ games.html
├─ profile.html
├─ login.html
├─ upload.html
├─ Animal.html
├─ ABC.html
├─ Num.html
├─ Marathi_Vowels.html
├─ Marathi_Consonants.html
├─ puzzle.html
├─ memory-match-15.html
├─ balloon-pop-party.html
├─ shape-match.html
├─ css/
├─ js/
├─ partials/
├─ sounds/
└─ videos/
```

## Main Pages

- [index.html](./index.html): landing screen
- [app.html](./app.html): main learning and video app
- [Learn.html](./Learn.html): learning hub
- [games.html](./games.html): games hub
- [Animal.html](./Animal.html): animal learning page with scroll-based sound interaction

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (`Fredoka One`, `Nunito`)
- Local browser storage for simple session/profile state

## Run Locally

Because this project is fully static, you can run it with any local server.

### Option 1: VS Code Live Server

1. Open the project folder in VS Code.
2. Install the `Live Server` extension.
3. Right-click `index.html` or `app.html`.
4. Click `Open with Live Server`.

### Option 2: Python

If Python is installed:

```bash
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500/index.html
```

### Option 3: Any Static Host

Upload the full project folder as-is to:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## Important Notes

- Keep the `videos/` and `sounds/` folders when uploading, or some learning pages and reels will not play local media.
- The app uses relative file paths, so folder names should stay the same after upload.
- Some user data is stored in `localStorage`, so progress is browser-specific unless you later connect it to a backend.

## Recommended Git Upload

Before uploading to GitHub, make sure these are included:

- all `.html` files
- the full `css/` folder
- the full `js/` folder
- `partials/`
- `sounds/`
- `videos/`
- this `README.md`

## License

This project currently has no license file included. If you want to make it public on GitHub, consider adding a license such as `MIT`.
