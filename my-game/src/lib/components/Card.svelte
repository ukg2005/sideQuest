<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href = undefined as string | undefined,
		class: className = '',
		padding = 'p-6',
		hover = true,
		children
	} = $props<{
		href?: string;
		class?: string;
		padding?: string;
		hover?: boolean;
		children: Snippet;
	}>();

	const base = 'sq-card';
	const hoverClass = hover ? 'sq-card--hover' : '';
</script>

{#if href}
	<a href={href} class={[base, hoverClass, padding, className].filter(Boolean).join(' ')}>
		{@render children()}
	</a>
{:else}
	<div class={[base, padding, className].filter(Boolean).join(' ')}>
		{@render children()}
	</div>
{/if}
