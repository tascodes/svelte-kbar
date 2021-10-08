<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Action } from './types';
	const dispatch = createEventDispatcher();

	export let match: Action;
	export let isActive: boolean;

	let buttonElement: HTMLButtonElement;

	export function focus() {
		buttonElement.focus();
	}

	function select() {
		dispatch('select');
	}

	function setindex() {
		dispatch('setindex');
	}
</script>

<li>
	<button
		bind:this={buttonElement}
		role="menuitem"
		on:click={select}
		on:focus={() => {
			dispatch('focus');
		}}
		on:blur={() => {
			dispatch('blur');
		}}
		on:mouseenter={setindex}
		on:pointerdown={setindex}
		class="default-result-wrapper"
		style="
        background: {isActive ? '#eee' : '#fff'};
        padding: 8px;
    "
	>
		<slot {match} />
	</button>
</li>

<style>
	button {
		display: block;
		border: none;
		padding: 1rem 2rem;
		margin: 0;
		text-decoration: none;
		font-family: sans-serif;
		font-size: 1rem;
		cursor: pointer;
		text-align: center;
		transition: background 250ms ease-in-out, transform 150ms ease;
		-webkit-appearance: none;
		-moz-appearance: none;
	}

	button:active {
		transform: scale(0.99);
	}
</style>
