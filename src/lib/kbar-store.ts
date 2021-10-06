import { writable } from 'svelte/store';
import type { Action, ActionId, ActionTree, KBarState } from './types';

export const kbarInitialState: KBarState = {
	search: '',
	actions: {},
	currentRootActionId: null
};

const kbarWritable = writable(kbarInitialState);

const kbarStore = {
	subscribe: kbarWritable.subscribe,
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
	registerActions: (actions: Action[]) => {
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
