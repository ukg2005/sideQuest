<script lang="ts">
	import { onMount } from 'svelte';
	import { recordGameStart } from '$lib/stats';

	const BEST_MS_KEY = 'sidequest:reaction-time:bestMs';

	type Phase = 'ready' | 'waiting' | 'go' | 'result';

	let phase = $state<Phase>('ready');
	let message = $state('Click Start, then click when it turns GO.');
	let lastMs = $state<number | null>(null);
	let bestMs = $state(0);

	let startedAt = $state<number | null>(null);
	let waitTimeout: ReturnType<typeof setTimeout> | undefined;

	function readInt(key: string): number {
		try {
			const raw = localStorage.getItem(key);
			const parsed = raw ? Number.parseInt(raw, 10) : 0;
			return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
		} catch {
			return 0;
		}
	}

	function clearTimers() {
		if (waitTimeout) clearTimeout(waitTimeout);
		waitTimeout = undefined;
	}

	function resetRun() {
		clearTimers();
		phase = 'ready';
		message = 'Click Start, then click when it turns GO.';
		lastMs = null;
		startedAt = null;
	}

	function resetBest() {
		const confirmed = window.confirm('Reset Reaction Time best?');
		if (!confirmed) return;
		bestMs = 0;
		try {
			localStorage.removeItem(BEST_MS_KEY);
		} catch {
			// ignore
		}
	}

	function start() {
		recordGameStart('reaction-time');
		clearTimers();
		phase = 'waiting';
		lastMs = null;
		startedAt = null;
		message = 'Wait for GO…';

		const delay = 1200 + Math.floor(Math.random() * 2300);
		waitTimeout = setTimeout(() => {
			phase = 'go';
			startedAt = performance.now();
			message = 'GO!';
		}, delay);
	}

	function handleClick() {
		if (phase === 'waiting') {
			clearTimers();
			phase = 'result';
			message = 'Too soon! False start.';
			lastMs = null;
			startedAt = null;
			return;
		}

		if (phase === 'go') {
			const started = startedAt;
			if (!started) return;
			const ms = Math.max(0, Math.round(performance.now() - started));
			lastMs = ms;
			phase = 'result';
			message = `${ms} ms`;
			startedAt = null;

			if (bestMs === 0 || ms < bestMs) {
				bestMs = ms;
				try {
					localStorage.setItem(BEST_MS_KEY, String(bestMs));
				} catch {
					// ignore
				}
			}
		}
	}

	function formatMs(value: number): string {
		if (!value || value <= 0) return '—';
		return `${value} ms`;
	}

	onMount(() => {
		bestMs = readInt(BEST_MS_KEY);
		return () => clearTimers();
	});
</script>

<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] flex flex-col items-center gap-8 relative py-8 px-4 sm:px-6">
	<header class="flex flex-col items-center gap-3">
		<div class="flex gap-3 justify-center items-center">
			<h1 class="text-4xl sm:text-5xl font-medium">Reaction Time</h1>
			<div class="relative group">
				<span class="w-6 h-6 bg-[var(--sq-surface)] text-[var(--sq-text)] font-semibold rounded-full flex justify-center items-center cursor-pointer shadow-md border border-[var(--sq-border)] transition-transform group-hover:scale-110">?</span>
				<div class="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-[var(--sq-surface)] text-[var(--sq-text)] text-sm leading-relaxed rounded-xl shadow-xl border border-[var(--sq-border)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all z-10">
					<p class="p-4">Press Start, wait for <strong>GO</strong>, then click as fast as you can. Clicking early counts as a false start.</p>
				</div>
			</div>
		</div>
	</header>

	<main class="w-full flex flex-col items-center gap-6">
		<div class="w-full max-w-2xl sq-card flex flex-col gap-6 p-5 sm:p-8">
			<div class="flex flex-wrap gap-x-6 gap-y-2 justify-between items-center">
				<div class="text-lg font-medium text-[var(--sq-muted)]">
					Best: <span class="text-[var(--sq-text)]">{formatMs(bestMs)}</span>
				</div>
				<div class="text-lg font-medium text-[var(--sq-muted)]">
					Last: <span class="text-[var(--sq-text)]">{lastMs ? formatMs(lastMs) : '—'}</span>
				</div>
				<div class="text-lg font-medium text-[var(--sq-muted)]">
					Phase: <span class="text-[var(--sq-text)]">{phase}</span>
				</div>
			</div>

			<button
				type="button"
				onclick={handleClick}
				class="w-full rounded-2xl border border-[var(--sq-border)] shadow-lg transition-colors cursor-pointer py-16 sm:py-20 text-4xl sm:text-5xl font-semibold
					{phase === 'go' ? 'bg-[var(--sq-accent)] text-[var(--sq-on-accent)]' : 'bg-[var(--sq-surface-2)] text-[var(--sq-text)] hover:bg-[var(--sq-surface)]'}">
				{message}
			</button>

			<div class="flex flex-col sm:flex-row gap-3 justify-end">
				{#if phase === 'ready' || phase === 'result'}
					<button
						type="button"
						onclick={start}
						class="sq-btn sq-btn--primary w-full sm:w-auto">
						Start
					</button>
				{:else}
					<button
						type="button"
						onclick={resetRun}
						class="sq-btn w-full sm:w-auto">
						Reset
					</button>
				{/if}

				{#if bestMs > 0}
					<button
						type="button"
						onclick={resetBest}
						class="sq-btn w-full sm:w-auto">
						Reset Best
					</button>
				{/if}
			</div>
		</div>
	</main>
</div>
