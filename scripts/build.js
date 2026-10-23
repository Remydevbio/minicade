#!/usr/bin/env node
// Scans games/*.html, reads each game's metadata, and assembles the site in _site/.
// No dependencies: runs on the Node that GitHub Actions provides.
//
// Per-game metadata (all optional) goes in the game's <head>:
//   <title>Dice Roller</title>
//   <meta name="description" content="Roll up to six dice.">
//   <meta name="emoji" content="🎲">
//
// Files whose name starts with "_" are skipped (handy for drafts).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const OUT_DIR = path.join(ROOT, '_site');

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
}

function getMeta(html, name) {
  const tag = html.match(new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i'));
  if (!tag) return '';
  const content = tag[0].match(/content=(?:"([^"]*)"|'([^']*)')/i);
  return content ? decodeEntities(content[1] ?? content[2] ?? '').trim() : '';
}

function prettify(filename) {
  return filename
    .replace(/\.html?$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function lastModified(target, fallbackFile = target) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', target], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (out) return out;
  } catch {
    // not a git checkout, fall through
  }
  return fs.statSync(fallbackFile).mtime.toISOString();
}

if (!fs.existsSync(GAMES_DIR)) {
  console.error('No games/ directory found.');
  process.exit(1);
}

// A game is either games/name.html or a folder games/name/ containing index.html
// (use a folder when a game has its own images, sounds or scripts).
const games = fs
  .readdirSync(GAMES_DIR, { withFileTypes: true })
  .filter((e) => !e.name.startsWith('_') && !e.name.startsWith('.'))
  .flatMap((e) => {
    const target = path.join(GAMES_DIR, e.name);
    if (e.isFile() && /\.html?$/i.test(e.name)) {
      return [{ id: e.name, target, page: target, url: `games/${encodeURIComponent(e.name)}` }];
    }
    if (e.isDirectory()) {
      const page = path.join(target, 'index.html');
      if (fs.existsSync(page)) {
        return [{ id: e.name, target, page, url: `games/${encodeURIComponent(e.name)}/` }];
      }
    }
    return [];
  })
  .map(({ id, target, page, url }) => {
    const html = fs.readFileSync(page, 'utf8');
    return {
      file: id,
      url,
      title: getTitle(html) || prettify(id),
      description: getMeta(html, 'description'),
      emoji: getMeta(html, 'emoji') || '🎮',
      updated: lastModified(target, page),
    };
  })
  .sort((a, b) => b.updated.localeCompare(a.updated));

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.cpSync(GAMES_DIR, path.join(OUT_DIR, 'games'), {
  recursive: true,
  filter: (src) => {
    const name = path.basename(src);
    if (name === '.DS_Store') return false;
    // Only top-level entries in games/ can be drafts (_name) or hidden (.name).
    // Inside a game's own folder, any file name is allowed (e.g. js/_util.js).
    if (path.dirname(src) === GAMES_DIR) return !name.startsWith('_') && !name.startsWith('.');
    return true;
  },
});
fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(OUT_DIR, 'index.html'));
fs.writeFileSync(path.join(OUT_DIR, 'games.json'), JSON.stringify(games, null, 2));

console.log(`Built ${games.length} game(s) into _site/`);
for (const g of games) console.log(`  ${g.emoji} ${g.title}  (${g.file})`);
