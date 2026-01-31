<script lang="ts">
	import { onMount } from 'svelte';
	import { recordGameStart } from '$lib/stats';

	const BEST_TIME_KEY = 'sidequest:memory-match:bestTimeSeconds';
	const BEST_MOVES_KEY = 'sidequest:memory-match:bestMoves';

	type Card = {
		id: string;
		value: string;
		faceUp: boolean;
		matched: boolean;
	};

	type IconId = 'circle' | 'square' | 'triangle' | 'diamond' | 'hex' | 'star' | 'plus' | 'bolt';

	const ICONS: Array<{ id: IconId; label: string; path: string }> = [
		{ id: 'circle', label: 'Circle', path: 'M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14Z' },
		{ id: 'square', label: 'Square', path: 'M7 7h10v10H7Z' },
		{ id: 'triangle', label: 'Triangle', path: 'M12 6l6 12H6l6-12Z' },
		{ id: 'diamond', label: 'Diamond', path: 'M12 5l7 7-7 7-7-7 7-7Z' },
		{ id: 'hex', label: 'Hexagon', path: 'M8 6h8l4 6-4 6H8l-4-6 4-6Z' },
		{ id: 'star', label: 'Star', path: 'M12 5l2.1 4.6 5 0.6-3.6 3.4 1 4.9-4.5-2.5-4.5 2.5 1-4.9-3.6-3.4 5-0.6L12 5Z' },
		{ id: 'plus', label: 'Plus', path: 'M11 6h2v5h5v2h-5v5h-2v-5H6v-2h5V6Z' },
		{ id: 'bolt', label: 'Bolt', path: 'M13 2L3 14h7l-1 8 10-12h-7l1-8Z' }
	];

	let cards = $state<Card[]>([]);
	let moves = $state(0);
	let elapsedSeconds = $state(0);
	let bestTimeSeconds = $state(0);
	let bestMoves = $state(0);
	let status = $state<'ready' | 'playing' | 'won'>('ready');

	let firstPickId = $state<string | null>(null);
	let secondPickId = $state<string | null>(null);
	let locked = $state(false);
	let startedAtMs = $state<number | null>(null);
	let timerInterval: ReturnType<typeof setInterval> | undefined;

	function readInt(key: string): number {
		try {
			const raw = localStorage.getItem(key);
			const parsed = raw ? Number.parseInt(raw, 10) : 0;
			return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
		} catch {
			return 0;
		}
	}

	function writeInt(key: string, value: number) {
		try {
			localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
		} catch {
			// ignore
		}
	}

	function clearTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = undefined;
	}

	function shuffle<T>(items: T[]): T[] {
		const arr = [...items];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function newDeck(): Card[] {
		const values = [...ICONS, ...ICONS];
		return shuffle(values).map((icon, index) => ({
			id: `${icon.id}-${index}-${Math.random().toString(16).slice(2)}`,
			value: icon.id,
			faceUp: false,
			matched: false
		}));
	}

	function iconFor(id: IconId) {
		return ICONS.find((i) => i.id === id) ?? ICONS[0];
	}

	function resetRun() {
		clearTimer();
		cards = newDeck();
		moves = 0;
		elapsedSeconds = 0;
		status = 'ready';
		firstPickId = null;
		secondPickId = null;
		locked = false;
		startedAtMs = null;
	}

	function resetBest() {
		const confirmed = window.confirm('Reset Memory Match best?');
		if (!confirmed) return;
		bestTimeSeconds = 0;
		bestMoves = 0;
		try {
			localStorage.removeItem(BEST_TIME_KEY);
			localStorage.removeItem(BEST_MOVES_KEY);
		} catch {
			// ignore
		}
	}

	function start() {
		recordGameStart('memory-match');
		resetRun();
		status = 'playing';
		startedAtMs = performance.now();
		clearTimer();
		timerInterval = setInterval(() => {
			if (!startedAtMs) return;
			elapsedSeconds = Math.floor((performance.now() - startedAtMs) / 1000);
		}, 250);
	}

	function flip(cardId: string) {
		if (status !== 'playing') return;
		if (locked) return;

		const idx = cards.findIndex((c) => c.id === cardId);
		if (idx < 0) return;
		const card = cards[idx];
		if (card.matched || card.faceUp) return;

		cards[idx] = { ...card, faceUp: true };

		if (!firstPickId) {
			firstPickId = cardId;
			return;
		}

		if (!secondPickId && cardId !== firstPickId) {
			secondPickId = cardId;
			moves += 1;
			checkMatch();
		}
	}

	function checkMatch() {
		const aId = firstPickId;
		const bId = secondPickId;
		if (!aId || !bId) return;

		const a = cards.find((c) => c.id === aId);
		const b = cards.find((c) => c.id === bId);
		if (!a || !b) return;

		locked = true;

		const isMatch = a.value === b.value;
		setTimeout(() => {
			const nextCards = cards.map((c) => {
				if (c.id !== aId && c.id !== bId) return c;
				return isMatch ? { ...c, matched: true } : { ...c, faceUp: false };
			});

			cards = nextCards;
			firstPickId = null;
			secondPickId = null;
			locked = false;

			if (nextCards.every((c) => c.matched)) {
				win();
			}
		}, 650);
	}

	function win() {
		clearTimer();
		status = 'won';

		const time = elapsedSeconds;
		const shouldUpdate =
			bestTimeSeconds === 0 ||
			time < bestTimeSeconds ||
			(time === bestTimeSeconds && bestMoves > 0 && moves < bestMoves);

		if (time > 0 && shouldUpdate) {
			bestTimeSeconds = time;
			bestMoves = moves;
			writeInt(BEST_TIME_KEY, bestTimeSeconds);
			writeInt(BEST_MOVES_KEY, bestMoves);
		}
	}

	function formatSeconds(seconds: number): string {
		if (!seconds || seconds <= 0) return '—';
		const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
		const ss = String(seconds % 60).padStart(2, '0');
		return `${mm}:${ss}`;
	}

	onMount(() => {
		bestTimeSeconds = readInt(BEST_TIME_KEY);
		bestMoves = readInt(BEST_MOVES_KEY);
		resetRun();
		return () => clearTimer();
	});
</script>

<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] flex flex-col items-center gap-6 sm:gap-8 relative py-6 sm:py-8">
	<header class="flex flex-col items-center gap-3">
		<div class="flex gap-3 justify-center items-center">
			<h1 class="text-4xl sm:text-5xl font-medium">Memory Match</h1>
			<details class="relative">
				<summary
					aria-label="How to play"
					class="list-none w-7 h-7 bg-[var(--sq-surface)] text-[var(--sq-text)] font-semibold rounded-full flex justify-center items-center cursor-pointer shadow-md border border-[var(--sq-border)] select-none">
					?
				</summary>
				<div class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 max-w-[90vw] bg-[var(--sq-surface)] text-[var(--sq-text)] text-sm leading-relaxed rounded-xl shadow-xl border border-[var(--sq-border)] z-10">
					<p class="p-4">Flip two cards at a time and match all pairs. Best score is the fastest time (ties break by fewer moves).</p>
				</div>
			</details>
		</div>
	</header>

	<main class="px-6 w-full flex flex-col items-center gap-5 sm:gap-6">
		<div class="w-full max-w-xl bg-[var(--sq-surface)] rounded-2xl shadow-2xl border border-[var(--sq-card-border)] flex flex-col gap-4 sm:gap-5 p-4 sm:p-6">
			<div class="flex flex-wrap gap-x-5 gap-y-1 justify-between items-center">
				<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Time: <span class="text-[var(--sq-text)]">{formatSeconds(elapsedSeconds)}</span></div>
				<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Moves: <span class="text-[var(--sq-text)]">{moves}</span></div>
				<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Best: <span class="text-[var(--sq-text)]">{formatSeconds(bestTimeSeconds)}</span></div>
				<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Best moves: <span class="text-[var(--sq-text)]">{bestMoves || '—'}</span></div>
			</div>

			{#if status === 'won'}
				<div class="bg-[var(--sq-surface-2)] rounded-xl border border-[var(--sq-border)] p-5 text-center">
					<p class="text-3xl font-semibold" style="color: var(--sq-accent)">You win!</p>
					<p class="mt-2 text-[var(--sq-muted)]">{formatSeconds(elapsedSeconds)} • {moves} moves</p>
				</div>
			{/if}

			<div class="mx-auto w-full max-w-[min(22rem,100%)] sm:max-w-[min(26rem,100%)]">
				<div class="grid grid-cols-4 gap-1.5 sm:gap-2">
				{#each cards as card (card.id)}
					<button
						type="button"
						onclick={() => flip(card.id)}
						aria-label={card.faceUp || card.matched ? iconFor(card.value as IconId).label : 'Hidden card'}
						class="aspect-square rounded-xl border border-[var(--sq-border)] transition-colors cursor-pointer flex items-center justify-center
							{card.matched ? 'bg-[var(--sq-surface-2)] opacity-70' : card.faceUp ? 'bg-[var(--sq-surface-2)]' : 'bg-[var(--sq-surface)] hover:bg-[var(--sq-surface-2)]'}">
						{#if card.faceUp || card.matched}
							<svg
								viewBox="0 0 24 24"
								class="select-none w-[clamp(26px,3.8vw,44px)] h-[clamp(26px,3.8vw,44px)] text-[var(--sq-text)]"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round">
								<path d={iconFor(card.value as IconId).path} />
							</svg>
						{:else}
							<span class="select-none text-[var(--sq-muted-2)] text-xl sm:text-2xl">●</span>
						{/if}
					</button>
				{/each}
				</div>
			</div>

			<div class="flex gap-3 justify-end">
				{#if status === 'ready'}
					<button type="button" onclick={start} class="sq-btn sq-btn--primary w-full sm:w-auto">
						Start
					</button>
				{:else}
					<button type="button" onclick={start} class="sq-btn sq-btn--primary w-full sm:w-auto">
						Play Again
					</button>
					<button type="button" onclick={resetRun} class="sq-btn w-full sm:w-auto">
						Reset
					</button>
				{/if}
				{#if bestTimeSeconds > 0}
					<button type="button" onclick={resetBest} class="sq-btn w-full sm:w-auto">
						Reset Best
					</button>
				{/if}
			</div>
		</div>
	</main>
</div>
