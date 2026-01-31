export type GameId = 'color-match' | 'hangman' | 'perfect-8' | 'reaction-time' | 'memory-match' | 'word-scramble';

const GAME_IDS: GameId[] = ['color-match', 'hangman', 'perfect-8', 'reaction-time', 'memory-match', 'word-scramble'];

const TOTAL_PLAYS_KEY = 'sidequest:stats:plays:total';
const PLAYS_KEY_PREFIX = 'sidequest:stats:plays:';
const LAST_PLAYED_KEY_PREFIX = 'sidequest:stats:lastPlayed:';

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

function writeString(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// ignore
	}
}

export function recordGameStart(gameId: GameId) {
	// Only call in the browser (event handlers / onMount).
	if (typeof localStorage === 'undefined') return;

	const totalPlays = readInt(TOTAL_PLAYS_KEY) + 1;
	writeInt(TOTAL_PLAYS_KEY, totalPlays);

	const gamePlaysKey = `${PLAYS_KEY_PREFIX}${gameId}`;
	const gamePlays = readInt(gamePlaysKey) + 1;
	writeInt(gamePlaysKey, gamePlays);

	writeString(`${LAST_PLAYED_KEY_PREFIX}${gameId}`, new Date().toISOString());
}

export function readGameStats() {
	if (typeof localStorage === 'undefined') {
		return {
			totalPlays: 0,
			playsByGame: Object.fromEntries(GAME_IDS.map((id) => [id, 0])) as Record<GameId, number>,
			lastPlayedByGame: Object.fromEntries(GAME_IDS.map((id) => [id, null])) as Record<GameId, string | null>
		};
	}

	const playsByGame: Record<GameId, number> = Object.fromEntries(GAME_IDS.map((id) => [id, 0])) as Record<GameId, number>;
	const lastPlayedByGame: Record<GameId, string | null> = Object.fromEntries(GAME_IDS.map((id) => [id, null])) as Record<
		GameId,
		string | null
	>;

	for (const gameId of GAME_IDS) {
		playsByGame[gameId] = readInt(`${PLAYS_KEY_PREFIX}${gameId}`);
		try {
			lastPlayedByGame[gameId] = localStorage.getItem(`${LAST_PLAYED_KEY_PREFIX}${gameId}`);
		} catch {
			lastPlayedByGame[gameId] = null;
		}
	}

	return {
		totalPlays: readInt(TOTAL_PLAYS_KEY),
		playsByGame,
		lastPlayedByGame
	};
}

export function formatLastPlayed(iso: string | null): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleString();
}

export function resetAllStats() {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(TOTAL_PLAYS_KEY);
		for (const gameId of GAME_IDS) {
			localStorage.removeItem(`${PLAYS_KEY_PREFIX}${gameId}`);
			localStorage.removeItem(`${LAST_PLAYED_KEY_PREFIX}${gameId}`);
		}
	} catch {
		// ignore
	}
}
