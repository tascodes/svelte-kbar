<script lang="ts">
	import { onMount } from 'svelte';
	import { kbarStore } from './kbar-store';
	import type KBarResults from './KBarResults.svelte';

	/**
	 * The component instance responsible for listing results.
	 *
	 * This prop should be handled by KBar.
	 */
	export let resultsComponent: KBarResults;

	/**
	 * A custom CSS class to be applied to the search input.
	 */
	export let customClass = null;

	/**
	 * Placeholder text displayed in the search input.
	 */
	export let placeholder = 'Type a command or search...';

	// Store bindings
	$: ({ search, currentRootActionId, actions } = $kbarStore);

	let searchInput: HTMLElement;

	onMount(() => {
		searchInput.focus();
	});

	/**
	 * Focus the search input
	 */
	export function focus() {
		searchInput.focus();
	}

	/**
	 * Handle the search input value changing
	 *
	 * @param event - the input change event
	 */
	function onInputChange(event) {
		kbarStore.setSearch(event.target.value);
	}

	/**
	 * Respond to keydown events while the search input is focused
	 *
	 * @param event - the keyboard event triggered
	 */
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
	class={customClass || 'kbar__search-default'}
	bind:this={searchInput}
	on:input={onInputChange}
	on:keydown={onInputKeydown}
	value={search}
	{placeholder}
/>

<style>
	.kbar__search-default {
		border: none;
		padding-left: 16px;
		height: 56px;
		width: 512px;
		font-size: 16px;
	}
</style>
