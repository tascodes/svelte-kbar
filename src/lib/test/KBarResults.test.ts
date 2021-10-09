import '@testing-library/jest-dom';

import { render } from '@testing-library/svelte';

import { kbarStore } from '../kbar-store';

import KBarResults from '../KBarResults.svelte';

describe('KBarResults', () => {
	beforeEach(() => {
		kbarStore.reset();
	});

	it('should not display when there are no actions', () => {
		const { queryByRole } = render(KBarResults);

		expect(queryByRole('menu')).not.toBeInTheDocument();
		expect(queryByRole('menuitem')).not.toBeInTheDocument();
	});

	it('should show a menu and menuitem when there is 1 action', () => {
		kbarStore.registerActions([
			{
				id: 'testaction',
				name: 'Test Action',
				shortcut: ['t'],
				keywords: 'test'
			}
		]);

		const { getByRole } = render(KBarResults);

		expect(getByRole('menu')).toBeInTheDocument();
		expect(getByRole('menuitem')).toBeInTheDocument();
	});
});
