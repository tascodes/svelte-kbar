<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { TransitionConfig, fade } from 'svelte/transition';
	import Portal from 'svelte-portal';
	import { kbarStore } from './kbar-store';
	import KBarResults from './KBarResults.svelte';
	import KBarSearch from './KBarSearch.svelte';
	import type { Action } from './types';

	export let positionContainerStyles = '';
	export let actions: Action[] = [];

	export let searchClass = null;
	export let resultClass = null;

	export let resultWrapper = null;

	export let transitionIn: (node: Element, params: any) => TransitionConfig = fade;
	export let transitionInParams = { duration: 200 };

	export let transitionOut: (node: Element, params: any) => TransitionConfig = fade;
	export let transitionOutParams = { duration: 200 };

	let resultsBinding: KBarResults;
	let searchBinding: KBarSearch;

	let kbarBinding: HTMLDivElement;

	let previousActiveElement;

	$: ({ visible } = $kbarStore);

	export function hide(restoreFocus = false) {
		kbarStore.hide();
		if (restoreFocus) {
			previousActiveElement.focus();
		}
	}

	export function show() {
		kbarStore.setSearch('');
		kbarStore.setCurrentRootAction(null);
		kbarStore.show();
		previousActiveElement = document.activeElement;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.ctrlKey && event.key === 'k') {
			event.preventDefault();
			if (visible) {
				hide(true);
			} else {
				show();
			}
		}

		if (event.key === 'Escape') {
			if (visible) {
				event.preventDefault();
				hide(true);
			}
		}
	}

	function handleWindowClick(event) {
		if (
			visible &&
			kbarBinding &&
			!kbarBinding.contains(event.target) &&
			kbarBinding !== event.target
		) {
			hide();
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

<svelte:window on:keydown={handleWindowKeydown} on:click={handleWindowClick} />

<Portal target="body">
	<div class="kbar__position-container" style={positionContainerStyles}>
		{#if visible}
			<div
				role="dialog"
				bind:this={kbarBinding}
				in:transitionIn={transitionInParams}
				out:transitionOut={transitionOutParams}
			>
				<KBarSearch
					customClass={searchClass}
					resultsComponent={resultsBinding}
					bind:this={searchBinding}
				/>
				<KBarResults
					wrapper={resultWrapper}
					customClass={resultClass}
					on:hide={() => {
						hide(true);
					}}
					searchComponent={searchBinding}
					bind:this={resultsBinding}
				/>
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
