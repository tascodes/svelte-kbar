<script lang="ts">
	import { matchSorter } from 'match-sorter';
	import { kbarStore } from './kbar-store';
	import type { Action, ActionId } from './types';

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
</script>

{#if matches.length}
	{#each matches as match}
		<div>
			{match.name}
		</div>
	{/each}
{/if}
