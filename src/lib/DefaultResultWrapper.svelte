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
</script>

<div
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
