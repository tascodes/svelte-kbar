import '@testing-library/jest-dom';

import { render } from '@testing-library/svelte';

import { kbarStore } from '../lib/kbar-store';

import KBar from '../lib/KBar.svelte';

describe('KBar', () => {
	beforeEach(() => {
		kbarStore.reset();
	});

	it('should render', () => {
		kbarStore.show();

		const { getByRole } = render(KBar);

		expect(getByRole('dialog')).toBeInTheDocument();
	});
});
