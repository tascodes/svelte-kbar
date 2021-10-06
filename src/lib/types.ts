import type { SvelteComponent } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';

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

export interface KBarOptions {
	animation?:
		| TransitionConfig
		| {
				enterMs?: number;
				exitMs?: number;
		  };
}

export interface KBarProps {
	actions: Action[];
	options?: KBarOptions;
}

export interface KBarState {
	searchQuery?: string;
	search?: string;
	actions: ActionTree;
	currentRootActionId?: ActionId | null | undefined;
}
