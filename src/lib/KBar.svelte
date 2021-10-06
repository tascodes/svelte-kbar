<script lang="ts">
	import Portal from 'svelte-portal/src/Portal.svelte';
	import { kbarStore } from './kbar-store';
	import KBarResults from './KBarResults.svelte';
	import KbarSearch from './KBarSearch.svelte';

	export let positionContainerStyles = '';

	kbarStore.registerActions([
		{
			id: 'blog',
			name: 'Blog',
			shortcut: ['b'],
			keywords: 'writing words',
			perform: () => (window.location.pathname = 'blog')
		},
		{
			id: 'contact',
			name: 'Contact',
			shortcut: ['c'],
			keywords: 'email',
			perform: () => (window.location.pathname = 'contact')
		}
	]);
</script>

<Portal target="body">
	<div class="kbar__position-container" style={positionContainerStyles}>
		<div>
			<KbarSearch />
			<KBarResults />
		</div>
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
