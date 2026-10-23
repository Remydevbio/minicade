# Tinycade: rules for creating games

These instructions are for Claude. Follow them whenever you create or edit a game that will be hosted on Tinycade.

Tinycade is a GitHub Pages site. On every push, a build script scans the `games/` folder and builds the landing page from each game's `<head>`. Nothing needs to be registered anywhere: if the file is in `games/` and its head is correct, the game appears on the landing page automatically. Do not edit `index.html` or any list of games.

## What to deliver

- One self-contained `.html` file per game, with HTML, CSS and JavaScript inline.
- Name the file in lowercase kebab-case after the game title, for example `echo-descent.html`.
- If a game has more than one file (separate JavaScript, CSS, images, sounds, data), deliver a folder instead. See "Bigger games with several files" below.
- Top-level files and folders in `games/` that start with `_` or `.` are ignored by the build. Use a leading `_` only for drafts.
- Google Fonts are fine. No other external dependencies, no server, no build step, no API keys, no analytics.
- When you hand the game over, tell the user the file name and that it goes in `games/`.

## Bigger games with several files

Use a folder whenever a game has separate JavaScript, CSS, images, sounds or data files:

```
games/game-name/
  index.html      required, and it must be called exactly index.html
  js/main.js
  css/style.css
  assets/sprite.png
```

- The three head tags described below go in `index.html`. The build reads only that file.
- Reference every file with a path relative to the file that references it (`js/main.js`, `../assets/sprite.png`). Never start a path with `/`.
- File names are case-sensitive on GitHub Pages. `Sprite.png` and `sprite.png` are different files, so match the case exactly.
- ES modules (`<script type="module">`) work on the deployed site. They do not work when `index.html` is opened straight from disk, so tell the user to test through a local server (for example `python3 -m http.server` run in the repo's `_site` folder after `node scripts/build.js`).
- Inside a game's own folder any file or folder name is allowed, including ones starting with `_`.
- Code or assets shared by several games go in `games/shared/`. A folder without an `index.html` is deployed but not listed on the landing page. Reference it with a relative path, for example `../shared/audio.js` from `games/game-name/index.html`.
- If the user builds a game with a bundler, the game folder holds the built output, not the sources and not `node_modules`. Configure the bundler for relative paths (Vite: `base: './'`).
- Keep assets compressed. The whole site should stay well under GitHub Pages' 1 GB limit.
- Everything else in these rules (head tags, unique storage keys, relative URLs) applies to folder games unchanged.

## Required tags in `<head>`

Put these three tags inside `<head>`, not in `<body>`. Tinycade reads them to build the game's tile.

```html
<title>Echo Descent</title>
<meta name="description" content="Fall through a pitch-black cave, ping the walls to see, and dodge the lurkers that hear you.">
<meta name="emoji" content="🦇">
```

- **title**: the game's name, one to four words, identical to the title shown in the game. Plain text only.
- **description**: one plain sentence of about 60 to 110 characters that says what the player does. No marketing words, no line breaks. Write `&amp;` for `&` and `&quot;` for a double quote.
- **emoji**: exactly one emoji that fits the game's theme, inside `content`.
- Use double quotes, with the `name` attribute before `content`.
- Keep the usual `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in the head as well.

If a tag is missing, Tinycade falls back to a prettified file name for the title, 🎮 for the emoji, and no description, which makes for a poor tile. When editing an existing game, keep its three tags unless the user asks to change them, and say so if you do.

## Rules for a shared site

- The site lives at a subpath (`username.github.io/tinycade/`), so use relative URLs only. Never use paths that start with `/`.
- All games share one origin, so `localStorage` keys must be unique per game. Prefix every key with the file name slug, for example `echo-descent-best`. Never use generic keys such as `best`, `highscore` or `muted`.
- Wrap every `localStorage` read and write in `try/catch`. The game must still run if storage is blocked.
- A game must work when its URL is opened directly. Never depend on the landing page or on other games.

## Defaults for gameplay, unless the user asks otherwise

- Support touch and keyboard, with the page never scrolling or zooming during play.
- Fill the screen at any size, including a phone held either way, and respect safe areas (`env(safe-area-inset-*)`).
- Pause when the tab becomes hidden, and offer a visible mute button if the game has sound.
- Start audio only after the first tap or key press.
- Respect `prefers-reduced-motion` for screen shake and flashing.

## Checklist before delivering

1. `<title>`, `<meta name="description">` and `<meta name="emoji">` are inside `<head>`, with all three filled in.
2. The game is a single `.html` file, or a folder whose entry file is `index.html`, named in kebab-case.
3. All paths are relative, file name case matches exactly, and all storage keys are prefixed with the game's slug.
4. The game runs from its URL alone, with no other file needed.
5. You told the user the file name and where to put it.
