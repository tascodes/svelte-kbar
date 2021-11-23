<script lang="ts">
	import KBar from '$lib/KBar.svelte';
	import type { Action } from '$lib/types';
	import MailIcon from '../example/MailIcon.svelte';

	const actions: Action[] = [
		{
			id: 'blog',
			name: 'Blog',
			shortcut: ['b'],
			keywords: 'writing words',
			icon: <any>MailIcon,
			subtitle: 'Go to the blog!',
			perform: () => (window.location.pathname = 'blog')
		},
		{
			id: 'contact',
			name: 'Contact',
			shortcut: ['c'],
			keywords: 'email',
			perform: () => (window.location.pathname = 'contact')
		},
		{
			id: 'theme',
			name: 'Set Theme',
			shortcut: ['t'],
			keywords: 'dark light mode',
			children: ['dark', 'light']
		},
		{
			id: 'dark',
			name: 'Dark Mode',
			parent: 'theme',
			shortcut: ['d'],
			keywords: '',
			perform: () => {
				console.log('Dark mode');
			}
		},
		{
			id: 'light',
			name: 'Light Mode',
			parent: 'theme',
			shortcut: ['l'],
			keywords: '',
			perform: () => {
				console.log('Light mode');
			}
		}
	];
</script>

<svelte:head>
	<title>svelte-kbar</title>
</svelte:head>

<div class="page-container">
	<h1>svelte-kbar</h1>
	<p>
		<a href="https://github.com/dwagio/svelte-kbar" target="_blank" rel="external">svele-kbar</a>
		is a command-k interface for use in svelte apps based on
		<a href="https://github.com/timc1/kbar" target="_blank" rel="external">timc1's kbar</a>.
	</p>
	<p>Try pressing <kbd>cmd</kbd>+<kbd>k</kbd> to open the kbar interface.</p>

	<a href="/licenses" rel="license">Licenses</a>
</div>

<KBar {actions} />

<style>
	.page-container {
		max-width: 1024px;
		margin: auto;
	}

	h1 {
		text-align: center;
	}

	p {
		font-size: 16px;
	}

	kbd {
		font-family: 'Inter', monospace;
		background: rgba(0 0 0 / 0.1);
		padding: 4px;
		border-radius: 4px;
	}
</style>
