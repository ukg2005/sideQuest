export type IconName =
	| 'perfect-8'
	| 'hangman'
	| 'color-match'
	| 'reaction-time'
	| 'memory-match'
	| 'word-scramble'
	| 'sun'
	| 'moon'
	| 'trophy'
	| 'rocket'
	| 'compass'
	| 'flame'
	| 'sparkles'
	| 'clock'
	| 'x-circle';

export type IconDef = {
	label: string;
	viewBox?: string;
	paths: string[];
};

// Simple, consistent line-style icons (24x24).
export const ICONS: Record<IconName, IconDef> = {
	'perfect-8': {
		label: 'Perfect 8',
		paths: [
			'M7 3h10l4 4v10l-4 4H7l-4-4V7l4-4Z',
			'M9 9h2v2H9V9Zm4 0h2v2h-2V9Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Z'
		]
	},
	'hangman': {
		label: 'Hangman',
		paths: [
			'M4 20h8',
			'M8 20V4h8',
			'M16 4v3',
			'M16 10a3 3 0 1 0 0 6a3 3 0 1 0 0-6Z',
			'M16 16v4',
			'M14 18l-2 2',
			'M18 18l2 2',
			'M14 14l-2-2',
			'M18 14l2-2'
		]
	},
	'color-match': {
		label: 'Color Match',
		paths: [
			'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z',
			'M12 3a9 9 0 0 1 9 9h-9V3Z'
		]
	},
	'reaction-time': {
		label: 'Reaction Time',
		paths: [
			'M13 2L3 14h7l-1 8 10-12h-7l1-8Z'
		]
	},
	'memory-match': {
		label: 'Memory Match',
		paths: [
			'M7 7h10v10H7Z',
			'M4 10V6a2 2 0 0 1 2-2h4',
			'M20 14v4a2 2 0 0 1-2 2h-4'
		]
	},
	'word-scramble': {
		label: 'Word Scramble',
		paths: [
			'M4 7h9',
			'M4 12h13',
			'M4 17h7',
			'M18 7l2 2-2 2',
			'M20 12h-2',
			'M15 17l2-2 2 2'
		]
	},
	sun: {
		label: 'Sun',
		paths: [
			'M12 4v2',
			'M12 18v2',
			'M4 12h2',
			'M18 12h2',
			'M6.3 6.3l1.4 1.4',
			'M16.3 16.3l1.4 1.4',
			'M6.3 17.7l1.4-1.4',
			'M16.3 7.7l1.4-1.4',
			'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z'
		]
	},
	moon: {
		label: 'Moon',
		paths: ['M21 12.8A7.5 7.5 0 0 1 11.2 3.1a6.5 6.5 0 1 0 9.8 9.7Z']
	},
	trophy: {
		label: 'Trophy',
		paths: [
			'M8 4h8v3a4 4 0 0 1-8 0V4Z',
			'M6 6H4v1a4 4 0 0 0 4 4',
			'M18 6h2v1a4 4 0 0 1-4 4',
			'M12 11v3',
			'M9 20h6',
			'M10 14h4v4h-4v-4Z'
		]
	},
	rocket: {
		label: 'Rocket',
		paths: [
			'M14 4c-4 1-7 4-8 8l4 4c4-1 7-4 8-8l-4-4Z',
			'M10 14l-3 1 2-4',
			'M14 10a1 1 0 1 0 0-2a1 1 0 0 0 0 2Z'
		]
	},
	compass: {
		label: 'Compass',
		paths: [
			'M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18Z',
			'M14 10l-1 5-5 1 1-5 5-1Z'
		]
	},
	flame: {
		label: 'Flame',
		paths: [
			'M12 2s4 4 4 8a4 4 0 0 1-8 0c0-4 4-8 4-8Z',
			'M8.5 13.5a3.5 3.5 0 1 0 7 0c0-2-1.2-3.5-3.5-5-2.3 1.5-3.5 3-3.5 5Z'
		]
	},
	sparkles: {
		label: 'Sparkles',
		paths: [
			'M12 2l1.2 4.2L17.5 8l-4.3 1.8L12 14l-1.2-4.2L6.5 8l4.3-1.8L12 2Z',
			'M19 12l.7 2.4L22 15l-2.3 1-.7 2.4-.7-2.4L16 15l2.3-.6L19 12Z',
			'M5 14l.7 2.4L8 17l-2.3 1L5 20l-.7-2-.7 2-2.3-1 2.3-.6L5 14Z'
		]
	},
	clock: {
		label: 'Clock',
		paths: ['M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18Z', 'M12 7v6l4 2']
	},
	'x-circle': {
		label: 'Error',
		paths: ['M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18Z', 'M9 9l6 6', 'M15 9l-6 6']
	}
};
