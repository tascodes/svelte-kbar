<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { TransitionConfig, fade } from 'svelte/transition';
	import Portal from 'svelte-portal/src/Portal.svelte';
	import { kbarStore } from './kbar-store';
	import KBarResults from './KBarResults.svelte';
	import KbarSearch from './KBarSearch.svelte';
	import type { Action } from './types';

	export let positionContainerStyles = '';
	export let actions: Action[] = [];

	export let transitionIn: (node: Element, params: any) => TransitionConfig = fade;
	export let transitionInParams = { duration: 200 };

	export let transitionOut: (node: Element, params: any) => TransitionConfig = fade;
	export let transitionOutParams = { duration: 200 };

	$: ({ visible } = $kbarStore);

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.ctrlKey && event.key === 'k') {
			kbarStore.show();
			event.preventDefault();
		}
	}

	let unregisterActions: () => void;
	onMount(() => {
		unregisterActions = kbarStore.registerActions(actions);
	});

	onDestroy(() => {
		if (unregisterActions) {
			unregisterActions();
		}
	});
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<Portal target="body">
	<div class="kbar__position-container" style={positionContainerStyles}>
		{#if visible}
			<div in:transitionIn={transitionInParams} out:transitionOut={transitionOutParams}>
				<KbarSearch />
				<KBarResults />
			</div>
		{/if}
	</div>
</Portal>

<style>
	.kbar__position-container {
		position: fixed;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		width: 100%;
		inset: 0px;
		padding: 14vh 16px 16px;
	}
</style>
