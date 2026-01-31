import { readGameStats } from '$lib/stats';
import type { IconName } from '$lib/icons';

const COLOR_MATCH_HIGH_SCORE_KEY = 'sidequest:color-match:highScore';
const HANGMAN_HIGH_SCORE_KEY = 'sidequest:hangman:highScore';
const PERFECT_8_BEST_TIME_PREFIX = 'sidequest:perfect-8:bestTimeLeft:';
const REACTION_TIME_BEST_MS_KEY = 'sidequest:reaction-time:bestMs';
const MEMORY_MATCH_BEST_TIME_KEY = 'sidequest:memory-match:bestTimeSeconds';
const WORD_SCRAMBLE_BEST_STREAK_KEY = 'sidequest:word-scramble:bestStreak';

type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible';
const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'impossible'];

export type AchievementId =
	| 'sq-starter'
	| 'sq-regular'
	| 'sq-addicted'
	| 'cm-10'
	| 'cm-25'
	| 'hm-4'
	| 'p8-win'
	| 'rt-300'
	| 'mm-60'
	| 'ws-5';

export type AchievementMode = 'atLeast' | 'atMost' | 'boolean';

export type Achievement = {
	id: AchievementId;
	title: string;
	description: string;
	icon: IconName;
	mode: AchievementMode;
	target: number;
	unit?: string;
	current: number;
	completed: boolean;
	progressPct: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function readInt(key: string): number {
	try {
		const raw = localStorage.getItem(key);
		const parsed = raw ? Number.parseInt(raw, 10) : 0;
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
	} catch {
		return 0;
	}
}

function bestPerfect8TimeLeft(): number {
	let best = 0;
	for (const d of difficulties) {
		best = Math.max(best, readInt(`${PERFECT_8_BEST_TIME_PREFIX}${d}`));
	}
	return best;
}

function isCompleted(mode: AchievementMode, current: number, target: number): boolean {
	if (mode === 'boolean') return current > 0;
	if (mode === 'atMost') return current > 0 && current <= target;
	return target > 0 && current >= target;
}

function progressPct(mode: AchievementMode, current: number, target: number): number {
	if (mode === 'boolean') return current > 0 ? 100 : 0;
	if (target <= 0) return 0;

	if (mode === 'atMost') {
		if (current <= 0) return 0;
		return clamp((target / current) * 100, 0, 100);
	}

	return clamp((current / target) * 100, 0, 100);
}

function make({
	id,
	title,
	description,
	icon,
	mode,
	current,
	target,
	unit
}: Omit<Achievement, 'completed' | 'progressPct'>): Achievement {
	return {
		id,
		title,
		description,
		icon,
		mode,
		current,
		target,
		unit,
		completed: isCompleted(mode, current, target),
		progressPct: progressPct(mode, current, target)
	};
}

export function getAchievements(): Achievement[] {
	const stats = readGameStats();
	const totalPlays = stats.totalPlays;

	const bestColorMatch = readInt(COLOR_MATCH_HIGH_SCORE_KEY);
	const bestHangman = readInt(HANGMAN_HIGH_SCORE_KEY);
	const bestPerfect8 = bestPerfect8TimeLeft();
	const bestReactionTimeMs = readInt(REACTION_TIME_BEST_MS_KEY);
	const bestMemoryTimeSeconds = readInt(MEMORY_MATCH_BEST_TIME_KEY);
	const bestWordScrambleStreak = readInt(WORD_SCRAMBLE_BEST_STREAK_KEY);

	const achievements: Achievement[] = [
		make({
			id: 'sq-starter',
			title: 'Starter',
			description: 'Start 5 games total',
			icon: 'rocket',
			mode: 'atLeast',
			current: totalPlays,
			target: 5,
			unit: 'starts'
		}),
		make({
			id: 'sq-regular',
			title: 'Regular',
			description: 'Start 20 games total',
			icon: 'compass',
			mode: 'atLeast',
			current: totalPlays,
			target: 20,
			unit: 'starts'
		}),
		make({
			id: 'sq-addicted',
			title: 'Addicted',
			description: 'Start 75 games total',
			icon: 'trophy',
			mode: 'atLeast',
			current: totalPlays,
			target: 75,
			unit: 'starts'
		}),
		make({
			id: 'cm-10',
			title: 'Color Pop',
			description: 'Hit a Color Match score of 10',
			icon: 'color-match',
			mode: 'atLeast',
			current: bestColorMatch,
			target: 10,
			unit: 'points'
		}),
		make({
			id: 'cm-25',
			title: 'Laser Focus',
			description: 'Hit a Color Match score of 25',
			icon: 'flame',
			mode: 'atLeast',
			current: bestColorMatch,
			target: 25,
			unit: 'points'
		}),
		make({
			id: 'hm-4',
			title: 'Word Wizard',
			description: 'Win Hangman with 4+ guesses remaining',
			icon: 'hangman',
			mode: 'atLeast',
			current: bestHangman,
			target: 4,
			unit: 'remaining'
		}),
		make({
			id: 'p8-win',
			title: 'Perfect Eight',
			description: 'Win Perfect-8 (any difficulty)',
			icon: 'perfect-8',
			mode: 'boolean',
			current: bestPerfect8 > 0 ? 1 : 0,
			target: 1
		}),
		make({
			id: 'rt-300',
			title: 'Lightning',
			description: 'Get Reaction Time under 300 ms',
			icon: 'reaction-time',
			mode: 'atMost',
			current: bestReactionTimeMs,
			target: 300,
			unit: 'ms'
		}),
		make({
			id: 'mm-60',
			title: 'Sharp Memory',
			description: 'Finish Memory Match in 60 s or less',
			icon: 'memory-match',
			mode: 'atMost',
			current: bestMemoryTimeSeconds,
			target: 60,
			unit: 's'
		}),
		make({
			id: 'ws-5',
			title: 'Word Streak',
			description: 'Reach a Word Scramble streak of 5',
			icon: 'word-scramble',
			mode: 'atLeast',
			current: bestWordScrambleStreak,
			target: 5,
			unit: 'streak'
		})
	];

	// Sort: incomplete first (higher progress first), then completed.
	achievements.sort((a, b) => {
		if (a.completed !== b.completed) return a.completed ? 1 : -1;
		return b.progressPct - a.progressPct;
	});

	return achievements;
}

export function achievementsSummary(achievements: Achievement[]): { completed: number; total: number } {
	const completed = achievements.filter((a) => a.completed).length;
	return { completed, total: achievements.length };
}
