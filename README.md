# SideQuest (Mini-Game Hub)

A small collection of browser mini-games built with SvelteKit. The goal is a clean “pick a game and play” experience, with each game implemented as its own route.

## Games

- **Color Match**: a Stroop-style reflex game with a timer, scoring, streaks, and randomized “match the word vs match the color” prompts.
- **Hangman**: classic word guessing.
- **Perfect 8**: a quick, dice-themed speed puzzle.
- **Reaction Time**: wait for “GO”, then click as fast as you can.
- **Memory Match**: flip cards and match all pairs (tracks time + moves).
- **Word Scramble**: unscramble as many words as you can (tracks best streak).

## What’s Included

- Local persistence (`localStorage`) for personal bests and play stats
- Profile dashboard (starts, last played, per-game breakdown)
- Achievements with progress bars
- Consistent design system (theme tokens + shared `Card`/`Icon` components)
- Mobile-friendly layout and controls

## Tech Stack

- SvelteKit + Svelte 5 (runes)
- TypeScript
- Tailwind CSS
- Vite

## Run Locally

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build locally
- `npm run check` — type-check with Svelte tooling
- `npm run format` / `npm run lint` — formatting checks

## Project Structure

- Home: `src/routes/+page.svelte`
- Game hub: `src/routes/games/+page.svelte`
- Games:
	- `src/routes/color-match/+page.svelte`
	- `src/routes/hangman/+page.svelte`
	- `src/routes/perfect-8/+page.svelte`
	- `src/routes/reaction-time/+page.svelte`
	- `src/routes/memory-match/+page.svelte`
	- `src/routes/word-scramble/+page.svelte`

## Why This Project

This repo is intentionally focused on “real UI + real game logic”:

- Timed rounds, state transitions (ready → playing → ended), derived UI, and feedback animations
- Clean routing and navigation between multiple games
- A consistent visual style using Tailwind

## License

No license has been chosen yet.
