
<script lang="ts">
    import { onMount } from 'svelte';
    import { Card, Icon } from '$lib';
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

    let bestColorMatch = $state('—');
    let bestHangman = $state('—');
    let bestPerfect8 = $state('—');
    let bestReactionTime = $state('—');
    let bestMemoryMatch = $state('—');
    let bestWordScramble = $state('—');

    const games: Array<{
        id: string;
        name: string;
        href: string;
        icon: IconName;
        tag: string;
        description: string;
        best: () => string;
    }> = [
        {
            id: 'perfect-8',
            name: 'Perfect 8',
            href: '/perfect-8',
            icon: 'perfect-8',
            tag: 'Speed Puzzle',
            description: 'Roll the dice, lock your luck, and beat the clock!',
            best: () => bestPerfect8
        },
        {
            id: 'hangman',
            name: 'Hangman',
            href: '/hangman',
            icon: 'hangman',
            tag: 'Word Game',
            description: 'Guess the hidden word before you run out of tries!',
            best: () => bestHangman
        },
        {
            id: 'color-match',
            name: 'Color Match',
            href: '/color-match',
            icon: 'color-match',
            tag: 'Reflex Game',
            description: 'Match the color, not the word! Test your focus and reflexes.',
            best: () => bestColorMatch
        },
        {
            id: 'reaction-time',
            name: 'Reaction Time',
            href: '/reaction-time',
            icon: 'reaction-time',
            tag: 'Reflex',
            description: 'Wait for GO, then click as fast as you can.',
            best: () => bestReactionTime
        },
        {
            id: 'memory-match',
            name: 'Memory Match',
            href: '/memory-match',
            icon: 'memory-match',
            tag: 'Memory',
            description: 'Flip cards and match all pairs in the fastest time.',
            best: () => bestMemoryMatch
        },
        {
            id: 'word-scramble',
            name: 'Word Scramble',
            href: '/word-scramble',
            icon: 'word-scramble',
            tag: 'Word',
            description: 'Unscramble as many words as you can in 60 seconds.',
            best: () => bestWordScramble
        }
    ];

    onMount(() => {
        bestColorMatch = (() => {
            const v = readInt(COLOR_MATCH_HIGH_SCORE_KEY);
            return v > 0 ? String(v) : '—';
        })();

        bestHangman = (() => {
            const v = readInt(HANGMAN_HIGH_SCORE_KEY);
            return v > 0 ? `${v} remaining` : '—';
        })();

        bestReactionTime = formatMs(readInt(REACTION_TIME_BEST_MS_KEY));

        bestMemoryMatch = (() => {
            const t = readInt(MEMORY_MATCH_BEST_TIME_KEY);
            const m = readInt(MEMORY_MATCH_BEST_MOVES_KEY);
            if (t <= 0) return '—';
            return m > 0 ? `${formatSeconds(t)} · ${m} moves` : formatSeconds(t);
        })();

        bestWordScramble = (() => {
            const v = readInt(WORD_SCRAMBLE_BEST_STREAK_KEY);
            return v > 0 ? String(v) : '—';
        })();

        bestPerfect8 = (() => {
            let best = 0;
            let bestDifficulty: Difficulty | null = null;
            for (const d of difficulties) {
                const v = readInt(`${PERFECT_8_BEST_TIME_PREFIX}${d}`);
                if (v > best) {
                    best = v;
                    bestDifficulty = d;
                }
            }
            if (best <= 0) return '—';
            return bestDifficulty ? `${formatSeconds(best)} (${bestDifficulty})` : formatSeconds(best);
        })();
    });
</script>


<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)]">
    <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-8">
        <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
			<div>
                <h1 class="text-4xl sm:text-5xl font-medium">Games</h1>
				<p class="mt-2 text-[var(--sq-muted)]">Pick a game, chase a new personal best.</p>
			</div>
		</header>

        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
			{#each games as game (game.id)}
				<Card
					href={game.href}
					class="group block no-underline"
                    padding="p-5 sm:p-6">
                    <div class="flex flex-col min-h-56 sm:min-h-60">
						<div class="flex items-start justify-between gap-4">
                            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--sq-surface-2)] border border-[var(--sq-border)] flex items-center justify-center">
                                <Icon name={game.icon} class="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
							<span class="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-[var(--sq-surface-2)] border border-[var(--sq-border)] text-[var(--sq-text)] group-hover:bg-[var(--sq-accent)] group-hover:text-[var(--sq-on-accent)] transition-colors">
								{game.tag}
							</span>
						</div>

						<div class="mt-5">
							<h2 class="text-2xl font-semibold group-hover:text-[var(--sq-accent)] transition-colors">
								{game.name}
							</h2>
							<p class="mt-2 text-sm font-medium leading-relaxed text-[var(--sq-muted)]">{game.description}</p>
						</div>

						<div class="mt-auto pt-6 flex items-end justify-between gap-4">
							<p class="text-xs font-semibold text-[var(--sq-muted)]">
								Best: <span class="text-[var(--sq-text)]">{game.best()}</span>
							</p>
							<span class="text-xs font-semibold text-[var(--sq-muted)] group-hover:text-[var(--sq-text)] transition-colors">
								Play →
							</span>
						</div>
					</div>
				</Card>
			{/each}
		</section>
	</div>
</div>