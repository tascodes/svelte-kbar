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

<div>
	<a href="#test">Link to test focus</a>
	<KBar searchClass="mySearch" dialogClass="myDialog" {actions} />
</div>

<style>
	:global(.mySearch) {
		border: none;
		padding-left: 16px;
		height: 56px;
		width: 512px;
		font-size: 16px;
	}

	:global(.myDialog) {
		box-shadow: 1px 2px 2px hsl(0deg 0% 50% / 0.2), 2px 4px 4px hsl(0deg 0% 50% / 0.2),
			4px 8px 8px hsl(0deg 0% 50% / 0.2), 8px 16px 16px hsl(0deg 0% 50% / 0.2),
			16px 32px 32px hsl(0deg 0% 50% / 0.2);
	}
</style>
