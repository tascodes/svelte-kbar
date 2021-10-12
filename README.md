# Svelte kbar

Svelte re-implementation of https://github.com/timc1/kbar

## Usage

1. Install in your project

```
yarn add svelte-kbar
```

or

```
npm install svelte-kbar
```

2. Use the KBar component in your svelte app

[See this live in the Svelte REPL](https://svelte.dev/repl/48685c134d644bf8b83cee8e513e680e?version=3.43.1)

```html
<script>
	import { KBar } from 'svelte-kbar';

	const actions = [
		{
			id: 'blog',
			name: 'Blog',
			shortcut: ['b'],
			keywords: 'writing words',
			perform: () => console.log('blog')
		},
		{
			id: 'contact',
			name: 'Contact',
			shortcut: ['c'],
			keywords: 'email',
			perform: () => console.log('contact')
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
			shortcut: ['d'],
			keywords: '',
			perform: () => {
				console.log('Light mode');
			}
		}
	];
</script>

<KBar {actions} />
```

## Development Setup

1. Clone this repository

```
git clone git@github.com:dwagio/svelte-kbar.git
```

2. Install dependencies

```
yarn install
```

3. Start the dev server

```
yarn run dev
```

4. Go to http://localhost:3000 to see your live development instance.
