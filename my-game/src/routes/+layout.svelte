<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Icon } from '$lib';

	let { children } = $props();

	type Theme = 'light' | 'dark';
	const THEME_STORAGE_KEY = 'sidequest:theme';
	let theme = $state<Theme>('light');

	function applyTheme(next: Theme) {
		theme = next;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', next === 'dark');
		}
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// ignore
		}
	}

	function toggleTheme() {
		applyTheme(theme === 'dark' ? 'light' : 'dark');
	}

	function isHomePath(pathname: string) {
		return pathname === '/' || pathname === '';
	}

	const pillBase =
		'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2';

	function pillClass(active: boolean) {
		return active
			? `${pillBase} bg-[var(--sq-accent)] text-[var(--sq-on-accent)] border-[var(--sq-accent)]`
			: `${pillBase} bg-[var(--sq-surface-2)] text-[var(--sq-text)] border-[var(--sq-border)] hover:bg-[var(--sq-surface)]`;
	}

	onMount(() => {
		try {
			const stored = localStorage.getItem(THEME_STORAGE_KEY);
			if (stored === 'light' || stored === 'dark') {
				applyTheme(stored);
				return;
			}
		} catch {
			// ignore
		}

		const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
		applyTheme(prefersDark ? 'dark' : 'light');
	});
</script>

<svelte:head>
	<title>SideQuest — Mini-Game Hub</title>
	<meta
		name="description"
		content="SideQuest is a polished mini-game hub built with SvelteKit. Play quick games, track personal bests, and unlock achievements." />
	<meta property="og:title" content="SideQuest — Mini-Game Hub" />
	<meta
		property="og:description"
		content="Play quick games, track personal bests, and unlock achievements." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="SideQuest — Mini-Game Hub" />
	<meta name="twitter:description" content="Play quick games, track personal bests, and unlock achievements." />
</svelte:head>

<div class="min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)]">
	{#if isHomePath($page.url.pathname)}
		<header class="fixed top-4 right-4 z-50">
			<button
				type="button"
				onclick={toggleTheme}
				aria-label="Toggle theme"
				title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				class="px-3 py-2 rounded-full text-sm font-medium shadow-lg border border-[var(--sq-border)] bg-[var(--sq-surface-2)] hover:bg-[var(--sq-surface)] transition-colors inline-flex items-center gap-2">
				<Icon name={theme === 'dark' ? 'moon' : 'sun'} class="w-5 h-5" />
				<span class="sr-only">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
			</button>
		</header>
	{:else}
		<header class="sticky top-0 z-50 border-b border-[var(--sq-border)] bg-[var(--sq-bg)]/90 backdrop-blur-sm shadow-sm">
			<nav class="mx-auto w-full max-w-6xl px-4 py-2.5 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a href="/" class="font-bold tracking-tight text-xl">SideQuest</a>
					<a
						href="/games"
						class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border border-[var(--sq-border)] bg-[var(--sq-surface-2)] hover:bg-[var(--sq-surface)] transition-colors">
						Back to Games
					</a>
				</div>

				<div class="flex items-center gap-2">
					<a href="/" class={pillClass(isHomePath($page.url.pathname))}>
						Home
					</a>
					<a href="/games" class={pillClass($page.url.pathname.startsWith('/games'))}>
						Games
					</a>
					<a href="/profile" class={pillClass($page.url.pathname.startsWith('/profile'))}>
						Profile
					</a>

					<button
						type="button"
						onclick={toggleTheme}
						aria-label="Toggle theme"
						title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
						class="ml-1 px-3 py-1.5 rounded-full text-sm font-medium border border-[var(--sq-border)] bg-[var(--sq-surface-2)] hover:bg-[var(--sq-surface)] transition-colors inline-flex items-center gap-2">
						<Icon name={theme === 'dark' ? 'moon' : 'sun'} class="w-5 h-5" />
						<span class="hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'}</span>
					</button>
				</div>
			</nav>
		</header>
	{/if}

	{#key $page.url.pathname}
		<div class="sq-page">
			{@render children()}
		</div>
	{/key}
</div>
