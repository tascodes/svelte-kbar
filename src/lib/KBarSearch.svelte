<script lang="ts">
	import { onMount } from 'svelte';
	import { kbarStore } from './kbar-store';

	$: search = $kbarStore.search;
	$: currentRootActionId = $kbarStore.currentRootActionId;
	$: actions = $kbarStore.actions;

	let searchInput: HTMLElement;

	onMount(() => {
		searchInput.focus();
	});

	function onInputChange(event) {
		kbarStore.setSearch(event.target.value);
	}

	function onInputKeydown(event) {
		if (currentRootActionId && !search && event.key === 'Backspace') {
			const parent = actions[currentRootActionId].parent;
			kbarStore.setCurrentRootAction(parent);
		}
	}
</script>

<input
	bind:this={searchInput}
	value={search}
	on:input={onInputChange}
	on:keydown={onInputKeydown}
/>
