<script lang="ts">
	import { onMount } from 'svelte';
	import { kbarStore } from './kbar-store';
	import type KBarResults from './KBarResults.svelte';

	// Props
	export let resultsComponent: KBarResults;
	export let customClass = null;

	// Store bindings
	$: ({ search, currentRootActionId, actions } = $kbarStore);

	let searchInput: HTMLElement;

	onMount(() => {
		searchInput.focus();
	});

	export function focus() {
		searchInput.focus();
	}

	function onInputChange(event) {
		kbarStore.setSearch(event.target.value);
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (currentRootActionId && !search && event.key === 'Backspace') {
			const parent = actions[currentRootActionId].parent;
			kbarStore.setCurrentRootAction(parent);
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			resultsComponent.focus();
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			resultsComponent.selectFirst();
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			resultsComponent.focusEnd();
		}

		if (event.key === 'Tab' && event.shiftKey) {
			event.preventDefault();
			resultsComponent.focusEnd();
		}

		if (event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault();
			resultsComponent.focus();
		}
	}
</script>

<input
	class={customClass || ''}
	bind:this={searchInput}
	value={search}
	on:input={onInputChange}
	on:keydown={onInputKeydown}
/>
