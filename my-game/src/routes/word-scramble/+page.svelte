<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { recordGameStart } from '$lib/stats';

	const BEST_STREAK_KEY = 'sidequest:word-scramble:bestStreak';

	const WORDS = [
		'abstract',
		'account',
		'achieve',
		'actions',
		'adapter',
		'angular',
		'array',
		'async',
		'atomic',
		'backend',
		'balance',
		'boolean',
		'border',
		'browser',
		'button',
		'canvas',
		'caption',
		'careful',
		'cascade',
		'catalog',
		'channel',
		'checkpoint',
		'classname',
		'cleanup',
		'client',
		'closure',
		'combine',
		'command',
		'commit',
		'compile',
		'compose',
		'concept',
		'console',
		'content',
		'context',
		'cookie',
		'corsair',
		'cursor',
		'dashboard',
		'database',
		'debugger',
		'decoder',
		'deploy',
		'derived',
		'desktop',
		'detect',
		'dialog',
		'diffuse',
		'display',
		'dynamic',
		'effect',
		'element',
		'encode',
		'engine',
		'error',
		'escape',
		'event',
		'exports',
		'feature',
		'fetch',
		'filter',
		'folder',
		'format',
		'forward',
		'framework',
		'frontend',
		'function',
		'gallery',
		'general',
		'github',
		'gradient',
		'handler',
		'helpers',
		'history',
		'hosted',
		'icons',
		'index',
		'input',
		'install',
		'interface',
		'iterate',
		'javascript',
		'json',
		'keyboard',
		'layout',
		'library',
		'localstorage',
		'logging',
		'mapping',
		'matrix',
		'memory',
		'message',
		'method',
		'middle',
		'minutes',
		'module',
		'motion',
		'mounted',
		'network',
		'object',
		'option',
		'package',
		'pattern',
		'payload',
		'persist',
		'pointer',
		'profile',
		'project',
		'promise',
		'purpose',
		'query',
		'random',
		'react',
		'refactor',
		'render',
		'request',
		'response',
		'restore',
		'results',
		'routing',
		'sanitize',
		'scheduler',
		'schema',
		'scope',
		'script',
		'search',
		'seconds',
		'select',
		'semantic',
		'serialize',
		'session',
		'shuffle',
		'sidequest',
		'snapshot',
		'software',
		'standard',
		'startup',
		'static',
		'storage',
		'string',
		'svelte',
		'sveltekit',
		'syntax',
		'target',
		'task',
		'theme',
		'throttle',
		'token',
		'toolkit',
		'typescript',
		'update',
		'upload',
		'utility',
		'validate',
		'value',
		'variable',
		'verify',
		'version',
		'virtual',
		'visible',
		'vite',
		'window'
	];

	type GameState = 'ready' | 'playing' | 'ended';

	let gameState = $state<GameState>('ready');
	let timeLeft = $state(60);
	let streak = $state(0);
	let bestStreak = $state(0);
	let feedback = $state('');

	let targetWord = $state('');
	let scrambled = $state('');
	let guess = $state('');
	let timerInterval: ReturnType<typeof setInterval> | undefined;
	let overlayPrimaryButton = $state<HTMLButtonElement | null>(null);
	let guessInput = $state<HTMLInputElement | null>(null);

	let liveMessage = $derived(() => {
		if (gameState !== 'ended') return '';
		return `Time. Final streak ${streak}. Best streak ${bestStreak}.`;
	});

	$effect(() => {
		if (gameState !== 'ended') return;
		tick().then(() => overlayPrimaryButton?.focus());
	});

	function readInt(key: string): number {
		try {
			const raw = localStorage.getItem(key);
			const parsed = raw ? Number.parseInt(raw, 10) : 0;
			return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
		} catch {
			return 0;
		}
	}

	function clearTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = undefined;
	}

	function pickWord(): string {
		return WORDS[Math.floor(Math.random() * WORDS.length)];
	}

	function shuffleChars(word: string): string {
		const chars = word.split('');
		for (let i = chars.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[chars[i], chars[j]] = [chars[j], chars[i]];
		}
		return chars.join('');
	}

	function newRound() {
		targetWord = pickWord();
		scrambled = shuffleChars(targetWord);
		// Avoid accidentally showing the answer.
		let safety = 0;
		while (scrambled === targetWord && safety < 6) {
			scrambled = shuffleChars(targetWord);
			safety += 1;
		}
		guess = '';
		feedback = '';
		tick().then(() => guessInput?.focus());
	}

	function start() {
		recordGameStart('word-scramble');
		clearTimer();
		timeLeft = 60;
		streak = 0;
		gameState = 'playing';
		newRound();
		tick().then(() => guessInput?.focus());

		timerInterval = setInterval(() => {
			timeLeft -= 1;
			if (timeLeft <= 0) {
				end();
			}
		}, 1000);
	}

	function end() {
		clearTimer();
		gameState = 'ended';
		if (streak > bestStreak) {
			bestStreak = streak;
			try {
				localStorage.setItem(BEST_STREAK_KEY, String(bestStreak));
			} catch {
				// ignore
			}
		}
	}

	function resetRun() {
		if (gameState === 'playing') {
			const confirmed = window.confirm('Reset your current run?');
			if (!confirmed) return;
		}
		clearTimer();
		gameState = 'ready';
		timeLeft = 60;
		streak = 0;
		targetWord = '';
		scrambled = '';
		guess = '';
		feedback = '';
	}

	function resetBest() {
		const confirmed = window.confirm('Reset Word Scramble best streak?');
		if (!confirmed) return;
		bestStreak = 0;
		try {
			localStorage.removeItem(BEST_STREAK_KEY);
		} catch {
			// ignore
		}
	}

	function submit() {
		if (gameState !== 'playing') return;
		const cleaned = guess.trim().toLowerCase();
		if (!cleaned) return;

		if (cleaned === targetWord) {
			streak += 1;
			feedback = '✓ Nice!';
			setTimeout(() => (feedback = ''), 450);
			newRound();
			tick().then(() => guessInput?.focus());
		} else {
			streak = 0;
			feedback = '✗ Try again';
			setTimeout(() => (feedback = ''), 600);
			tick().then(() => guessInput?.focus());
		}
	}

	onMount(() => {
		bestStreak = readInt(BEST_STREAK_KEY);
		return () => clearTimer();
	});
</script>

<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] flex flex-col items-center gap-8 relative py-8 px-4 sm:px-6">
	<div class="sr-only" aria-live="polite" role="status">{liveMessage}</div>
	{#if gameState === 'ended'}
		<div class="fixed inset-0 bg-black/50 flex justify-center items-center z-40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Game over">
			<div class="bg-[var(--sq-surface)] p-10 rounded-3xl shadow-2xl text-center border-2 border-[var(--sq-border)]">
				<h2 class="text-4xl font-semibold text-[var(--sq-text)] mb-2">Time!</h2>
				<p class="mb-2 text-5xl font-bold" style="color: var(--sq-accent)">{streak}</p>
				<p class="text-[var(--sq-muted)] mb-2">Best streak: <span class="font-semibold text-[var(--sq-text)]">{bestStreak}</span></p>
				<button bind:this={overlayPrimaryButton} onclick={start} class="bg-[var(--sq-accent)] text-[var(--sq-on-accent)] px-8 py-3 rounded-full font-semibold hover:bg-[var(--sq-accent-2)] transition-colors shadow-lg cursor-pointer">
					Play Again
				</button>
			</div>
		</div>
	{/if}

	<header class="flex flex-col items-center gap-3">
		<div class="flex gap-3 justify-center items-center">
			<h1 class="text-4xl sm:text-5xl font-medium">Word Scramble</h1>
			<details class="relative">
				<summary
					aria-label="How to play"
					class="list-none w-7 h-7 bg-[var(--sq-surface)] text-[var(--sq-text)] font-semibold rounded-full flex justify-center items-center cursor-pointer shadow-md border border-[var(--sq-border)] select-none">
					?
				</summary>
				<div class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 max-w-[90vw] bg-[var(--sq-surface)] text-[var(--sq-text)] text-sm leading-relaxed rounded-xl shadow-xl border border-[var(--sq-border)] z-10">
					<p class="p-4">Unscramble as many words as you can in 60 seconds. Wrong answers reset your streak.</p>
				</div>
			</details>
		</div>
	</header>

	<main class="w-full flex flex-col items-center gap-6">
		{#if gameState === 'ready'}
			<div class="w-full max-w-2xl sq-card flex flex-col gap-6 p-6 sm:p-9 items-center">
				<h2 class="text-3xl font-semibold text-[var(--sq-text)]">Ready?</h2>
				<p class="text-[var(--sq-muted)] text-center max-w-md">Type the correct word and press Enter. Keep a streak going to set a new best.</p>
				<button onclick={start} class="sq-btn sq-btn--primary px-10 py-4 text-lg sm:text-xl rounded-full">
					Start
				</button>
				{#if bestStreak > 0}
					<div class="flex flex-col items-center gap-2">
						<p class="text-[var(--sq-muted)]">Best streak: <span class="font-semibold text-[var(--sq-accent)]">{bestStreak}</span></p>
						<button type="button" onclick={resetBest} class="sq-btn">
							Reset Best
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="w-full max-w-2xl sq-card flex flex-col gap-6 p-4 sm:p-8">
				<div class="flex flex-wrap gap-x-6 gap-y-1 justify-between items-center">
					<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Time: <span class="text-[var(--sq-text)]">{timeLeft}s</span></div>
					<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Streak: <span class="text-[var(--sq-text)]">{streak}</span></div>
					<div class="text-base sm:text-lg font-medium text-[var(--sq-muted)]">Best: <span class="text-[var(--sq-text)]">{bestStreak}</span></div>
				</div>

				<div class="bg-[var(--sq-surface-2)] p-5 sm:p-6 rounded-xl border border-[var(--sq-border)] text-center">
					<p class="text-sm text-[var(--sq-muted)]">Unscramble:</p>
					<p class="mt-2 text-4xl sm:text-5xl font-semibold tracking-widest break-all">{scrambled}</p>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						submit();
					}}
					class="flex flex-col sm:flex-row gap-3 items-stretch">
					<input
						bind:this={guessInput}
						bind:value={guess}
						placeholder="Type your guess…"
						autocomplete="off"
						autocapitalize="none"
						inputmode="text"
						class="w-full sm:flex-1 px-4 py-3 rounded-lg bg-[var(--sq-surface-2)] border border-[var(--sq-border)] text-[var(--sq-text)] placeholder:text-[var(--sq-muted-2)] focus:outline-none focus:ring-2 focus:ring-[var(--sq-accent)]" />
					<div class="flex flex-col sm:flex-row gap-3">
						<button type="submit" class="sq-btn sq-btn--primary w-full sm:w-auto">
							Submit
						</button>
						<button type="button" onclick={resetRun} class="sq-btn w-full sm:w-auto">
							Reset
						</button>
					</div>
				</form>

				{#if feedback}
					<p class="text-sm text-[var(--sq-muted)]">{feedback}</p>
				{/if}

				{#if bestStreak > 0}
					<div class="flex justify-end">
						<button type="button" onclick={resetBest} class="sq-btn w-full sm:w-auto">
							Reset Best
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>
