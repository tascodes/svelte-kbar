import '@testing-library/jest-dom';

import { render, fireEvent } from '@testing-library/svelte';

import { kbarStore } from '../lib/kbar-store';

import KBarResults from '../lib/KBarResults.svelte';

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

	it('should perform an action that is clicked', async () => {
		const perform = jest.fn();

		kbarStore.registerActions([
			{
				id: 'testaction',
				name: 'Test Action',
				shortcut: ['t'],
				keywords: 'test',
				perform
			}
		]);

		const { getByRole } = render(KBarResults);

		const button = getByRole('menuitem');
		await fireEvent.click(button);

		expect(perform).toHaveBeenCalled();
	});
});
