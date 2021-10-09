<script lang="ts">
	import type { Action } from './types';

	export let result: Action;
	export let active: boolean;
</script>

<div class="result-wrapper" class:active>
	{#if result.icon}
		<div class="result-wrapper__icon">
			<svelte:component this={result.icon} />
		</div>
	{/if}
	<div class="result-wrapper__titles">
		<span class="result-wrapper__name">{result.name}</span>
		{#if result.subtitle}
			<div>{result.subtitle}</div>
		{/if}
	</div>
	{#if result.shortcut}
		<kbd class="result-wrapper__shortcut">{result.shortcut}</kbd>
	{/if}
</div>

<style>
	.result-wrapper {
		display: flex;
		align-items: center;
		background-color: white;
		padding: 12px 16px;
	}

	.active {
		border-left: 2px solid #000000;
		background-color: rgba(0 0 0 / 0.05);
	}

	.result-wrapper__name {
		font-size: 16px;
	}

	.result-wrapper__titles {
		width: 100%;
	}

	.result-wrapper__icon {
		width: 18px;
		height: 18px;
		margin-right: 8px;
	}

	.result-wrapper__shortcut {
		padding: 4px 6px;
		background: rgba(0 0 0 / 0.1);
		border-radius: 4px;
	}
</style>
