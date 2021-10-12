import '@testing-library/jest-dom';

import { render } from '@testing-library/svelte';

import { kbarStore } from '../lib/kbar-store';

import KBarSearch from '../lib/KBarSearch.svelte';

describe('KBarSearch', () => {
	beforeEach(() => {
		kbarStore.reset();
	});

	it('should show an input', () => {
		const { getByRole } = render(KBarSearch);

		const textbox = getByRole('textbox');

		expect(textbox).toBeInTheDocument();
		expect(textbox).toHaveFocus();
	});

	describe('focus', () => {
		it('should focus the input element', () => {
			const { getByRole, component } = render(KBarSearch);

			const textbox = getByRole('textbox');

			textbox.blur();
			expect(textbox).not.toHaveFocus();

			component.focus();
			expect(textbox).toHaveFocus();
		});
	});
});
