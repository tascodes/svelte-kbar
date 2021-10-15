<script lang="ts">
	import { onMount, onDestroy, SvelteComponent } from 'svelte';
	import { TransitionConfig, fade } from 'svelte/transition';
	import Portal from 'svelte-portal/src/Portal.svelte';
	import { kbarStore } from './kbar-store';
	import KBarResults from './KBarResults.svelte';
	import KBarSearch from './KBarSearch.svelte';
	import type { Action } from './types';

	/**
	 * Custom styles for the positioning container
	 */
	export let positionContainerStyles = '';

	/**
	 * List of actions to include in the KBar selection
	 */
	export let actions: Action[] = [];

	/**
	 * Custom CSS class for the containing KBar dialog
	 *
	 * Be sure to wrap your class selector with `:global()`, for example
	 *
	 * ```css
	 * :global(.myKbarDialog) {
	 *   color: red;
	 * }
	 * ```
	 */
	export let dialogClass: string = null;

	/**
	 * Custom CSS class for the search input
	 *
	 * Be sure to wrap your class selector with `:global()`, for example
	 *
	 * ```css
	 * :global(.myKbarSearchInput) {
	 *   color: red;
	 * }
	 * ```
	 */
	export let searchClass: string = null;

	/**
	 * Placeholder text to display in the search input
	 */
	export let searchPlaceholder = 'Type a command or search...';

	/**
	 * Custom CSS class for the list of actions
	 *
	 * Be sure to wrap your class selector with `:global()`, for example
	 *
	 * ```css
	 * :global(.myKbarAction) {
	 *   color: red;
	 * }
	 * ```
	 */
	export let resultListClass: string = null;

	/**
	 * Custom CSS class for a single result item
	 *
	 * Be sure to wrap your class selector with `:global()`, for example
	 *
	 * ```css
	 * :global(.myKbarResult) {
	 *   color: red;
	 * }
	 * ```
	 */
	export let resultItemClass: string = null;

	/**
	 * The component to display the details of a single Action.
	 *
	 * Should accept the props
	 * - `result`: Action
	 * - `active`: boolean
	 *
	 * DefaultResultWrapper is the default wrapper used.
	 */
	export let resultWrapper: SvelteComponent = null;

	/**
	 * Transition for the KBar to fade in. This can be any transition you want.
	 */
	export let transitionIn: (node: Element, params: any) => TransitionConfig = fade;

	/**
	 * Parameters to pass the fade-in transition
	 */
	export let transitionInParams = { duration: 200 };

	/**
	 * Transition for the KBar to fade out. This can be any transition you want.
	 */
	export let transitionOut: (node: Element, params: any) => TransitionConfig = fade;

	/**
	 * Parameters to pass the fade-out transition
	 */
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
		} else {
			event.stopPropagation();
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
	{#if visible}
		<div class="kbar__position-container" style={positionContainerStyles}>
			<div
				role="dialog"
				class={dialogClass || ''}
				bind:this={kbarBinding}
				in:transitionIn={transitionInParams}
				out:transitionOut={transitionOutParams}
			>
				<KBarSearch
					customClass={searchClass}
					resultsComponent={resultsBinding}
					placeholder={searchPlaceholder}
					bind:this={searchBinding}
				/>
				<KBarResults
					wrapper={resultWrapper}
					customListClass={resultListClass}
					customButtonClass={resultItemClass}
					on:hide={() => {
						hide(true);
					}}
					searchComponent={searchBinding}
					bind:this={resultsBinding}
				/>
			</div>
		</div>
	{/if}
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
