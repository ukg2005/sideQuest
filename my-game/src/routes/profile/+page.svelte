<script lang="ts">
	import { onMount } from 'svelte';
	import { formatLastPlayed, readGameStats, resetAllStats, type GameId } from '$lib/stats';
	import { Card, Icon } from '$lib';
	import { achievementsSummary, getAchievements, type Achievement } from '$lib/achievements';
	import type { IconName } from '$lib/icons';

	const COLOR_MATCH_HIGH_SCORE_KEY = 'sidequest:color-match:highScore';
	const HANGMAN_HIGH_SCORE_KEY = 'sidequest:hangman:highScore';
	const PERFECT_8_BEST_TIME_PREFIX = 'sidequest:perfect-8:bestTimeLeft:';
	const REACTION_TIME_BEST_MS_KEY = 'sidequest:reaction-time:bestMs';
	const MEMORY_MATCH_BEST_TIME_KEY = 'sidequest:memory-match:bestTimeSeconds';
	const MEMORY_MATCH_BEST_MOVES_KEY = 'sidequest:memory-match:bestMoves';
	const WORD_SCRAMBLE_BEST_STREAK_KEY = 'sidequest:word-scramble:bestStreak';

	type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible';
	const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'impossible'];

	let totalPlays = $state(0);
	let playsByGame = $state<Record<GameId, number>>({
		'color-match': 0,
		hangman: 0,
		'perfect-8': 0,
		'reaction-time': 0,
		'memory-match': 0,
		'word-scramble': 0
	});
	let lastPlayedByGame = $state<Record<GameId, string | null>>({
		'color-match': null,
		hangman: null,
		'perfect-8': null,
		'reaction-time': null,
		'memory-match': null,
		'word-scramble': null
	});

	let bestColorMatch = $state(0);
	let bestHangman = $state(0);
	let bestPerfect8 = $state<Record<Difficulty, number>>({ easy: 0, medium: 0, hard: 0, impossible: 0 });
	let bestReactionTimeMs = $state(0);
	let bestMemoryMatchTimeSeconds = $state(0);
	let bestMemoryMatchMoves = $state(0);
	let bestWordScrambleStreak = $state(0);
	let mostPlayedLabel = $state('—');
	let mostPlayedId = $state<GameId | null>(null);
	let lastPlayedOverall = $state<string | null>(null);
	let achievements = $state<Achievement[]>([]);
	let achievementStats = $state<{ completed: number; total: number }>({ completed: 0, total: 0 });

	const socials = {
		linkedin: 'https://www.linkedin.com/in/udaykirangorli',
		github: 'https://github.com/ukg2005',
		resume: '/resume.pdf'
	} as const;

	function readInt(key: string): number {
		try {
			const raw = localStorage.getItem(key);
			const parsed = raw ? Number.parseInt(raw, 10) : 0;
			return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
		} catch {
			return 0;
		}
	}

	function formatSeconds(seconds: number): string {
		if (!seconds || seconds <= 0) return '—';
		const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
		const ss = String(seconds % 60).padStart(2, '0');
		return `${mm}:${ss}`;
	}

	function formatMs(ms: number): string {
		if (!ms || ms <= 0) return '—';
		return `${ms} ms`;
	}

	function formatGameLabel(gameId: string): string {
		switch (gameId) {
			case 'color-match':
				return 'Color Match';
			case 'hangman':
				return 'Hangman';
			case 'perfect-8':
				return 'Perfect-8';
			case 'reaction-time':
				return 'Reaction Time';
			case 'memory-match':
				return 'Memory Match';
			case 'word-scramble':
				return 'Word Scramble';
			default:
				return gameId;
		}
	}

	const gameDefs: Array<{
		id: GameId;
		name: string;
		href: string;
		icon: IconName;
		bestLabel: string;
		hint?: string;
	}> = [
		{ id: 'color-match', name: 'Color Match', href: '/color-match', icon: 'color-match', bestLabel: 'Best score' },
		{ id: 'hangman', name: 'Hangman', href: '/hangman', icon: 'hangman', bestLabel: 'Best remaining', hint: 'Higher is better' },
		{ id: 'perfect-8', name: 'Perfect-8', href: '/perfect-8', icon: 'perfect-8', bestLabel: 'Best time left' },
		{ id: 'reaction-time', name: 'Reaction Time', href: '/reaction-time', icon: 'reaction-time', bestLabel: 'Best', hint: 'Lower is better' },
		{ id: 'memory-match', name: 'Memory Match', href: '/memory-match', icon: 'memory-match', bestLabel: 'Best time' },
		{ id: 'word-scramble', name: 'Word Scramble', href: '/word-scramble', icon: 'word-scramble', bestLabel: 'Best streak' }
	];

	function bestValueFor(gameId: GameId): string {
		switch (gameId) {
			case 'color-match':
				return bestColorMatch > 0 ? String(bestColorMatch) : '—';
			case 'hangman':
				return bestHangman > 0 ? String(bestHangman) : '—';
			case 'reaction-time':
				return formatMs(bestReactionTimeMs);
			case 'memory-match':
				return formatSeconds(bestMemoryMatchTimeSeconds);
			case 'word-scramble':
				return bestWordScrambleStreak > 0 ? String(bestWordScrambleStreak) : '—';
			case 'perfect-8': {
				const best = Math.max(bestPerfect8.easy, bestPerfect8.medium, bestPerfect8.hard, bestPerfect8.impossible);
				return formatSeconds(best);
			}
			default:
				return '—';
		}
	}

	function bestSubValueFor(gameId: GameId): string | null {
		if (gameId === 'memory-match') {
			return bestMemoryMatchMoves > 0 ? `${bestMemoryMatchMoves} moves` : null;
		}
		return null;
	}

	function getLastPlayedOverall(stats: Record<GameId, string | null>): string | null {
		let best: string | null = null;
		for (const iso of Object.values(stats)) {
			if (!iso) continue;
			if (!best || iso > best) best = iso;
		}
		return best;
	}

	function load() {
		const stats = readGameStats();
		totalPlays = stats.totalPlays;
		playsByGame = stats.playsByGame;
		lastPlayedByGame = stats.lastPlayedByGame;
		lastPlayedOverall = getLastPlayedOverall(stats.lastPlayedByGame);

		const entries = Object.entries(stats.playsByGame) as Array<[GameId, number]>;
		entries.sort((a, b) => b[1] - a[1]);
		const top = entries[0];
		if (top && top[1] > 0) {
			mostPlayedId = top[0];
			mostPlayedLabel = formatGameLabel(top[0]);
		} else {
			mostPlayedId = null;
			mostPlayedLabel = '—';
		}

		bestColorMatch = readInt(COLOR_MATCH_HIGH_SCORE_KEY);
		bestHangman = readInt(HANGMAN_HIGH_SCORE_KEY);
		bestReactionTimeMs = readInt(REACTION_TIME_BEST_MS_KEY);
		bestMemoryMatchTimeSeconds = readInt(MEMORY_MATCH_BEST_TIME_KEY);
		bestMemoryMatchMoves = readInt(MEMORY_MATCH_BEST_MOVES_KEY);
		bestWordScrambleStreak = readInt(WORD_SCRAMBLE_BEST_STREAK_KEY);

		const loaded: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0, impossible: 0 };
		for (const d of difficulties) {
			loaded[d] = readInt(`${PERFECT_8_BEST_TIME_PREFIX}${d}`);
		}
		bestPerfect8 = loaded;

		achievements = getAchievements();
		achievementStats = achievementsSummary(achievements);
	}

	function resetStats() {
		const confirmed = window.confirm('Reset ALL stats (starts + last played + bests) on this device?');
		if (!confirmed) return;
		resetAllStats();
		try {
			localStorage.removeItem(COLOR_MATCH_HIGH_SCORE_KEY);
			localStorage.removeItem(HANGMAN_HIGH_SCORE_KEY);
			localStorage.removeItem(REACTION_TIME_BEST_MS_KEY);
			localStorage.removeItem(MEMORY_MATCH_BEST_TIME_KEY);
			localStorage.removeItem(MEMORY_MATCH_BEST_MOVES_KEY);
			localStorage.removeItem(WORD_SCRAMBLE_BEST_STREAK_KEY);
			for (const d of difficulties) {
				localStorage.removeItem(`${PERFECT_8_BEST_TIME_PREFIX}${d}`);
			}
		} catch {
			// ignore
		}
		load();
	}

	function resetAllBests() {
		const confirmed = window.confirm('Reset ALL best scores for every game?');
		if (!confirmed) return;
		try {
			localStorage.removeItem(COLOR_MATCH_HIGH_SCORE_KEY);
			localStorage.removeItem(HANGMAN_HIGH_SCORE_KEY);
			localStorage.removeItem(REACTION_TIME_BEST_MS_KEY);
			localStorage.removeItem(MEMORY_MATCH_BEST_TIME_KEY);
			localStorage.removeItem(MEMORY_MATCH_BEST_MOVES_KEY);
			localStorage.removeItem(WORD_SCRAMBLE_BEST_STREAK_KEY);
			for (const d of difficulties) {
				localStorage.removeItem(`${PERFECT_8_BEST_TIME_PREFIX}${d}`);
			}
		} catch {
			// ignore
		}
		load();
	}

	onMount(() => {
		load();
	});
</script>


<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] p-4 sm:p-6">
	<div class="max-w-5xl mx-auto flex flex-col gap-6">
		<header class="flex flex-col gap-2">
			<h1 class="text-4xl sm:text-5xl font-medium">Profile</h1>
			<p class="text-[var(--sq-muted)]">Your stats and best scores across SideQuest.</p>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Card hover={false} padding="p-6" class="shadow-xl">
				<p class="text-sm font-medium text-[var(--sq-muted-2)]">Total Games Started</p>
				<p class="text-5xl font-bold mt-2" style="color: var(--sq-accent)">{totalPlays}</p>
			</Card>
			<Card hover={false} padding="p-6" class="shadow-xl">
				<p class="text-sm font-medium text-[var(--sq-muted-2)]">Most Played</p>
				<p class="text-2xl font-semibold mt-2">{mostPlayedLabel}</p>
				<p class="text-sm text-[var(--sq-muted)] mt-1">Based on game starts</p>
				{#if mostPlayedId}
					<a
						href={gameDefs.find((g) => g.id === mostPlayedId)?.href ?? '/games'}
						class="inline-flex mt-3 text-sm font-medium underline underline-offset-4 decoration-[var(--sq-border)] hover:decoration-[var(--sq-text)]">
						Play {mostPlayedLabel}
					</a>
				{/if}
			</Card>
			<Card hover={false} padding="p-6" class="shadow-xl">
				<p class="text-sm font-medium text-[var(--sq-muted-2)]">Last Played</p>
				<p class="text-2xl font-semibold mt-2">{formatLastPlayed(lastPlayedOverall)}</p>
				<p class="text-sm text-[var(--sq-muted)] mt-1">Most recent game session</p>
				<div class="mt-3 flex gap-2 flex-wrap">
					<button
						type="button"
						onclick={resetStats}
						class="sq-btn">
						Reset Stats
					</button>
					<button
						type="button"
						onclick={resetAllBests}
						class="sq-btn sq-btn--danger">
						Reset Bests
					</button>
				</div>
			</Card>
		</section>

		<Card hover={false} padding="p-5 sm:p-6" class="shadow-xl">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h2 class="text-2xl font-semibold">Achievements</h2>
					<p class="text-sm text-[var(--sq-muted)]">Badges that track your progress</p>
				</div>
				<p class="text-sm text-[var(--sq-muted)] sm:text-right">
					<span class="font-semibold text-[var(--sq-text)]">{achievementStats.completed}</span>/{achievementStats.total} unlocked
				</p>
			</div>

			<div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each achievements as a (a.id)}
					<div class="rounded-2xl border border-[var(--sq-border)] bg-[var(--sq-surface-2)] p-4 sm:p-5">
						<div class="flex items-start justify-between gap-4">
							<div class="flex items-start gap-3">
								<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--sq-surface)] border border-[var(--sq-border)] flex items-center justify-center">
									<Icon name={a.icon} class="w-5 h-5" />
								</div>
								<div class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<p class="text-lg font-semibold">{a.title}</p>
										{#if a.completed}
											<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--sq-accent)] text-[var(--sq-on-accent)]">Unlocked</span>
										{/if}
									</div>
									<p class="text-sm text-[var(--sq-muted)]">{a.description}</p>
								</div>
							</div>

							<div class="text-right text-sm text-[var(--sq-muted)] whitespace-nowrap">
								{#if a.mode === 'boolean'}
									{a.completed ? 'Done' : '—'}
								{:else if a.current > 0}
									{a.current}/{a.target}{#if a.unit} {a.unit}{/if}
								{:else}
									—
								{/if}
							</div>
						</div>

						<div class="mt-3 h-2 rounded-full bg-[var(--sq-surface)] border border-[var(--sq-border)] overflow-hidden">
							<div class="h-full rounded-full" style="background: var(--sq-accent); width: {a.progressPct}%;"></div>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<section class="flex flex-col sm:flex-row sm:items-end justify-between mt-2 gap-1 sm:gap-4">
			<h2 class="text-2xl font-semibold">Your Games</h2>
			<p class="text-sm text-[var(--sq-muted)]">Everything in one place</p>
		</section>

		<section class="grid grid-cols-1 gap-3">
			{#each gameDefs as game (game.id)}
				<Card hover={false} padding="p-0" class="shadow-xl hover:shadow-2xl transition-shadow">
					<details class="p-5">
						<summary class="list-none cursor-pointer select-none">
						<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
							<div class="flex items-start gap-4">
								<div class="w-11 h-11 rounded-2xl bg-[var(--sq-surface-2)] border border-[var(--sq-border)] flex items-center justify-center">
									<Icon name={game.icon} class="w-6 h-6" />
								</div>
								<div class="flex flex-col gap-1">
									<h3 class="text-xl sm:text-2xl font-semibold leading-tight">{game.name}</h3>
									<p class="text-sm text-[var(--sq-muted)]">
										<span class="font-medium">Started:</span> {playsByGame[game.id] ?? 0}
										<span class="mx-2 text-[var(--sq-muted-2)]">•</span>
										<span class="font-medium">Last:</span> {formatLastPlayed(lastPlayedByGame[game.id] ?? null)}
									</p>
								</div>
							</div>

							<div class="sm:text-right">
								<p class="text-sm font-medium text-[var(--sq-muted-2)]">{game.bestLabel}</p>
								<p class="text-2xl font-bold" style="color: var(--sq-accent)">{bestValueFor(game.id)}</p>
								{#if bestSubValueFor(game.id)}
									<p class="text-xs text-[var(--sq-muted)]">{bestSubValueFor(game.id)}</p>
								{:else if game.hint}
									<p class="text-xs text-[var(--sq-muted)]">{game.hint}</p>
								{/if}
							</div>
						</div>
						</summary>

						<div class="mt-4 pt-4 border-t border-[var(--sq-border)] flex flex-col gap-3">
						<div class="flex flex-col sm:flex-row flex-wrap gap-2 justify-between sm:items-center text-sm text-[var(--sq-muted)]">
							<p>
								<span class="font-medium text-[var(--sq-text)]">Best:</span> {bestValueFor(game.id)}
								{#if bestSubValueFor(game.id)}
									<span class="ml-2 text-[var(--sq-muted-2)]">({bestSubValueFor(game.id)})</span>
								{/if}
							</p>
							<a
								href={game.href}
								class="sq-btn w-full sm:w-auto text-center">
								Play
							</a>
						</div>

						{#if game.id === 'perfect-8'}
							<div class="bg-[var(--sq-surface-2)] rounded-xl border border-[var(--sq-border)] p-4">
								<p class="text-sm font-medium text-[var(--sq-text)]">Times by difficulty</p>
								<div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-[var(--sq-muted)]">
									<div>Easy: <span class="font-semibold text-[var(--sq-text)]">{formatSeconds(bestPerfect8.easy)}</span></div>
									<div>Medium: <span class="font-semibold text-[var(--sq-text)]">{formatSeconds(bestPerfect8.medium)}</span></div>
									<div>Hard: <span class="font-semibold text-[var(--sq-text)]">{formatSeconds(bestPerfect8.hard)}</span></div>
									<div>Impossible: <span class="font-semibold text-[var(--sq-text)]">{formatSeconds(bestPerfect8.impossible)}</span></div>
								</div>
							</div>
						{/if}
						</div>
					</details>
				</Card>
			{/each}
		</section>

		<Card hover={false} padding="p-5 sm:p-6" class="shadow-xl">
			<h2 class="text-2xl font-semibold">Socials</h2>
			<div class="mt-4 flex flex-wrap gap-3">
				<a
					href={socials.linkedin}
					target="_blank"
					rel="noreferrer"
					class="sq-btn sq-btn--primary w-full sm:w-auto text-center">
					LinkedIn
				</a>
				<a
					href={socials.github}
					target="_blank"
					rel="noreferrer"
					class="sq-btn sq-btn--primary w-full sm:w-auto text-center">
					GitHub
				</a>
				<a
					href={socials.resume}
					target="_blank"
					rel="noreferrer"
					class="sq-btn sq-btn--primary w-full sm:w-auto text-center">
					Resume
				</a>
			</div>
		</Card>
	</div>
</div>
