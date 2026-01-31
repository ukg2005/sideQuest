<script lang="ts">
	import type { IconName } from '$lib/icons';
	import { ICONS } from '$lib/icons';

	let { name, class: className = '' } = $props<{ name: IconName; class?: string }>();

	let def = $derived(ICONS[name as IconName] ?? ICONS.trophy);
</script>

<svg
	viewBox={def.viewBox ?? '0 0 24 24'}
	class={['shrink-0', className].filter(Boolean).join(' ')}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true">
	{#each def.paths as d (d)}
		<path d={d} />
	{/each}
</svg>
