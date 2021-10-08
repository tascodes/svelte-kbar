<script lang="ts">
	import { matchSorter } from 'match-sorter';
	import { createEventDispatcher } from 'svelte';
	import { kbarStore } from './kbar-store';
	import type KBarSearch from './KBarSearch.svelte';
	import type { Action, ActionId } from './types';

	const dispatch = createEventDispatcher();

	// Props
	export let searchComponent: KBarSearch;
	export let customClass = null;
	export let wrapper = null;

	// Store bindings
	$: ({ search, currentRootActionId, actions } = $kbarStore);

	// Internal state
	let activeIndex = 0;
	let listBinding;
	let resultBindings = [];
	let hasFocus = false;
	let justEntered = false;

	export function focus() {
		if (matches.length && resultBindings.length) {
			justEntered = true;
			hasFocus = true;
			activeIndex = 0;
		}
	}

	export function focusEnd() {
		if (matches.length && resultBindings.length) {
			justEntered = true;
			hasFocus = true;
			activeIndex = matches.length - 1;
		}
	}

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

	$: matches =
		search.trim() === ''
			? filteredList
			: matchSorter(filteredList, search, { keys: ['keywords', 'name'] });

	// Reset active index on root action change
	//@ts-ignore
	$: currentRootActionId, filteredList.length, search, resetActiveIndex();
</script>

<svelte:window on:keydown={handleWindowKeyDown} />

{#if matches.length}
	<ul bind:this={listBinding} role="menu">
		{#each matches as match, index}
			<li role="none">
				<button
					class={customClass || ''}
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
						<svelte:component this={wrapper} result={match} />
					{:else}
						{match.name}
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
		width: 100%;
		border: none;
		margin: 0;
		text-decoration: none;
		font-family: sans-serif;
		font-size: 1rem;
		cursor: pointer;
		text-align: center;
		-webkit-appearance: none;
		-moz-appearance: none;
	}
</style>
