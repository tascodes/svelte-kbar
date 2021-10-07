<script lang="ts">
	import { matchSorter } from 'match-sorter';
	import DefaultResultWrapper from './DefaultResultWrapper.svelte';
	import { kbarStore } from './kbar-store';
	import type { Action, ActionId } from './types';

	export let resultWrapper = DefaultResultWrapper;

	$: search = $kbarStore.search;
	$: currentRootActionId = $kbarStore.currentRootActionId;
	$: actions = $kbarStore.actions;
	let activeIndex = 0;

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

	function resetActiveIndex() {
		activeIndex = 0;
	}

	// Reset active index on root action change
	//@ts-ignore
	$: currentRootActionId, filteredList.length, search, resetActiveIndex();

	function select() {
		const action = matches[activeIndex];

		if (!action) {
			return;
		}

		if (action.perform) {
			action.perform();
			kbarStore.hide();
		} else {
			kbarStore.setCurrentRootAction(action.id);
		}
	}

	function handleWindowKeyDown(event: KeyboardEvent) {
		event.stopPropagation();

		if (event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n')) {
			event.preventDefault();

			if (activeIndex >= matches.length - 1) {
				activeIndex = 0;
			} else {
				activeIndex = activeIndex + 1;
			}
		}

		if (event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p')) {
			event.preventDefault();

			if (activeIndex === 0) {
				activeIndex = matches.length - 1;
			} else {
				activeIndex = activeIndex - 1;
			}
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			select();
		}
	}
</script>

<svelte:window on:keydown={handleWindowKeyDown} />

{#if matches.length}
	{#each matches as match, index}
		<!-- <DefaultResultWrapper
			isActive={index === activeIndex}
			on:select={select}
			on:setindex={() => {
				activeIndex = index;
			}}
		>
			{match.name}
		</DefaultResultWrapper> -->
		<svelte:component
			this={resultWrapper}
			isActive={index === activeIndex}
			on:select={select}
			on:setindex={() => {
				activeIndex = index;
			}}
			{match}
		>
			{match.name}
		</svelte:component>
	{/each}
{/if}
