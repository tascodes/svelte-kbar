import { writable } from 'svelte/store';
import type { Action, ActionId, ActionTree, KBarState } from './types';

export const kbarInitialState: KBarState = {
	search: '',
	actions: {},
	currentRootActionId: null,
	visible: false
};

const kbarWritable = writable(kbarInitialState);

const kbarStore = {
	subscribe: kbarWritable.subscribe,
	setVisible: (visible: boolean) => {
		kbarWritable.update((state) => {
			return {
				...state,
				visible
			};
		});
	},
	show: () => {
		kbarWritable.update((state) => {
			return {
				...state,
				visible: true
			};
		});
	},
	hide: () => {
		kbarWritable.update((state) => {
			return {
				...state,
				visible: false
			};
		});
	},
	setCurrentRootAction: (actionId: ActionId | null | undefined) => {
		kbarWritable.update((state) => ({
			...state,
			currentRootActionId: actionId
		}));
	},
	setSearch: (search: string) => {
		kbarWritable.update((state) => {
			console.log('search', search);
			return {
				...state,
				search
			};
		});
	},
	registerActions: (actions: Action[]): (() => void) => {
		const actionsByKey: ActionTree = actions.reduce((acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		}, {});

		kbarWritable.update((state) => {
			return {
				...state,
				actions: {
					...actionsByKey,
					...state.actions
				}
			};
		});

		return function unregister() {
			kbarWritable.update((state) => {
				const actions = state.actions;
				const removeActionIds = Object.keys(actionsByKey);
				removeActionIds.forEach((actionId) => delete actions[actionId]);
				return {
					...state,
					actions: {
						...state.actions,
						...actions
					}
				};
			});
		};
	}
};

export { kbarStore };
