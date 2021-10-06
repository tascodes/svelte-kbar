<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function select() {
		dispatch('select');
	}

	function setindex() {
		dispatch('setindex');
	}

	export let isActive;

	let wrapper;

	// if (typeof window !== 'undefined' && isActive) {
	// 	// wait for the KBarAnimator to resize, _then_ scrollIntoView.
	// 	window.requestAnimationFrame(() =>
	// 		window.requestAnimationFrame(() => {
	// 			const element = wrapper.current;
	// 			if (!element) {
	// 				return;
	// 			}
	// 			element.scrollIntoView({ block: 'nearest' });
	// 		})
	// 	);
	// }
</script>

<div
	bind:this={wrapper}
	on:click={select}
	on:mouseenter={setindex}
	on:pointerdown={setindex}
	class="default-result-wrapper"
	style="
        background: {isActive ? '#eee' : '#fff'};
        padding: 8px;
    "
>
	<slot />
</div>
