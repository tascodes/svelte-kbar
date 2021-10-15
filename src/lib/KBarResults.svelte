<script lang="ts">
	import { matchSorter } from 'match-sorter';
	import { createEventDispatcher } from 'svelte';
	import DefaultResultWrapper from './DefaultResultWrapper.svelte';
	import { kbarStore } from './kbar-store';
	import type KBarSearch from './KBarSearch.svelte';
	import type { Action, ActionId } from './types';

	const dispatch = createEventDispatcher();

	// Props
	export let searchComponent: KBarSearch;
	export let customListClass = null;
	export let customButtonClass = null;
	export let wrapper = null;

	// Store bindings
	$: ({ search, currentRootActionId, actions } = $kbarStore);

	// Internal state
	let activeIndex = 0;
	let listBinding;
	let resultBindings = [];
	let hasFocus = false;
	let justEntered = false;
	let matches = [];

	/**
	 * Focus the first visible action in the list
	 */
	export function focus() {
		if (matches.length && resultBindings.length) {
			justEntered = true;
			hasFocus = true;
			activeIndex = 0;
		}
	}

	/**
	 * Focus the last visible action in the list
	 */
	export function focusEnd() {
		if (matches.length && resultBindings.length) {
			justEntered = true;
			hasFocus = true;
			activeIndex = matches.length - 1;
		}
	}

	/**
	 * Select/perform the first visible action in the list
	 */
	export function selectFirst() {
		activeIndex = 0;
		select();
	}

	function resetActiveIndex() {
		activeIndex = 0;
	}

	function select() {
		if (activeIndex < 0) {
			return;
		}

		const action = matches[activeIndex];

		if (!action) {
			return;
		}

		if (action.perform) {
			action.perform();
			dispatch('hide');
		} else {
			kbarStore.setCurrentRootAction(action.id);
			kbarStore.setSearch('');
		}
	}

	function incrementActiveIndex() {
		if (activeIndex >= matches.length - 1) {
			activeIndex = 0;
		} else {
			activeIndex = activeIndex + 1;
		}
	}

	function decrementActiveIndex() {
		if (activeIndex === 0) {
			activeIndex = matches.length - 1;
		} else {
			activeIndex = activeIndex - 1;
		}
	}

	function handleWindowKeyDown(event: KeyboardEvent) {
		if (!hasFocus) {
			return;
		}

		if (justEntered) {
			justEntered = false;
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n')) {
			incrementActiveIndex();
		}

		if (event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p')) {
			decrementActiveIndex();
		}

		if (event.key === 'Enter') {
			searchComponent.focus();
			select();
		}

		if (event.key === 'Home') {
			activeIndex = 0;
		}

		if (event.key === 'End') {
			activeIndex = matches.length - 1;
		}

		if (event.key === 'Tab' && !event.shiftKey) {
			incrementActiveIndex();
		}

		if (event.key === 'Tab' && event.shiftKey) {
			activeIndex = 0;
			searchComponent.focus();
		}
	}

	function checkIfBlurred() {
		if (!listBinding?.contains(document.activeElement)) {
			hasFocus = false;
		}
	}

	$: {
		if (hasFocus && resultBindings.length && resultBindings.length > activeIndex) {
			resultBindings[activeIndex]?.focus();
		}
	}

	$: actionsList = Object.keys(actions).map((key) => {
		return actions[key];
	});

	$: currActions = (function (): Record<ActionId, Action> {
		if (!currentRootActionId) {
			return actionsList.reduce((acc, curr) => {
				if (!curr.parent) {
					acc[curr.id] = curr;
				}
				return acc;
			}, {});
		}

		const root = actions[currentRootActionId];
		const children = root.children;

		if (!children) {
			return {
				[root.id]: root
			};
		}

		return {
			...children.reduce((acc, actionId) => {
				acc[actionId] = actions[actionId];
				return acc;
			}, {})
		};
	})();

	$: filteredList = Object.keys(currActions).map((key) => {
		const action = currActions[key];
		return action;
	}) as Action[];

	$: {
		const trimmedSearch = search.trim();
		if (trimmedSearch === '') {
			matches = filteredList;
		} else {
			// Get a list of matches sorted by search relevance
			let sortedMatches = matchSorter(filteredList, search, { keys: ['keywords', 'name'] });

			if (trimmedSearch.length === 1) {
				// Find any matches with the given shortcut
				const shortcutActions = filteredList.filter((action) =>
					action.shortcut.includes(trimmedSearch)
				);

				const shortcutIds = shortcutActions.map((action) => action.id);

				if (shortcutActions.length) {
					sortedMatches = sortedMatches.filter((match) => {
						return !shortcutIds.includes(match.id);
					});
					sortedMatches = [...shortcutActions, ...sortedMatches];
				}
			}

			matches = sortedMatches;
		}
	}

	// Reset active index on root action change
	//@ts-ignore
	$: currentRootActionId, filteredList.length, search, resetActiveIndex();
</script>

<svelte:window on:keydown={handleWindowKeyDown} />

{#if matches.length}
	<ul class={customListClass || ''} bind:this={listBinding} role="menu">
		{#each matches as match, index}
			<li role="none">
				<button
					class={customButtonClass || ''}
					role="menuitem"
					bind:this={resultBindings[index]}
					on:click={select}
					on:focus={() => {
						hasFocus = true;
						activeIndex = index;
					}}
					on:blur={checkIfBlurred}
					on:mouseenter={() => {
						activeIndex = index;
					}}
					on:pointerdown={() => {
						activeIndex = index;
					}}
				>
					{#if !!wrapper}
						<svelte:component this={wrapper} result={match} active={activeIndex === index} />
					{:else}
						<DefaultResultWrapper result={match} active={activeIndex === index} />
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		list-style-type: none;
		padding: 0;
		margin: 0;
	}

	button {
		display: block;
		background-color: white;
		width: 100%;
		border: none;
		padding: 0;
		margin: 0;
		text-decoration: none;
		text-align: left;
		cursor: pointer;
		-webkit-appearance: none;
		-moz-appearance: none;
	}
</style>
