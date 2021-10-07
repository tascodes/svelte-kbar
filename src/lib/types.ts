import type { SvelteComponent } from 'svelte';

export type ActionId = string;

export interface Action {
	id: string;
	name: string;
	shortcut: string[];
	keywords: string;
	perform?: () => void;
	section?: string;
	parent?: ActionId | null | undefined;
	children?: ActionId[];
	icon?: string | SvelteComponent;
	subtitle?: string;
}

export type ActionTree = Record<string, Action>;

export interface KBarState {
	search?: string;
	actions: ActionTree;
	currentRootActionId?: ActionId | null | undefined;
	visible: boolean;
}
