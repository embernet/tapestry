
import { ColorScheme } from './types';

export const NODE_MAX_WIDTH = 160;
export const NODE_PADDING = 10;
export const LINK_DISTANCE = 250;
export const DEFAULT_NODE_COLOR = '#6b7280'; // gray-500

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'scheme-useful-harmful',
    name: 'Useful Harmful',
    tagColors: {
      'Useful': '#22c55e',
      'Harmful': '#ef4444',
      'Action': '#3b82f6',
      'Emotion': '#f97316',
      'Context': '#6b7280',
      'Trend': '#14b8a6', // teal-500
    },
    relationshipLabels: [
      'causes',
      'prevents',
      'mitigates',
      'accelerates',
      'requires',
      'conflicts with',
      'relates to',
      'improves'
    ]
  },
  {
    id: 'scheme-networking',
    name: 'Networking',
    tagColors: {
      'Organisation': '#111827', // gray-900, using dark gray instead of pure black for better visibility
      'Person': '#f97316',
      'Action': '#3b82f6',
      'Product': '#22c55e',
      'Idea': '#eab308',
      'Topic': '#a855f7', // purple-500
      'Question': '#ec4899', // pink-500
      'Challenge': '#ef4444', // red-500
      'Trend': '#14b8a6', // teal-500
    },
    relationshipLabels: [
      'knows',
      'works for',
      'author of',
      'member of',
      'interested in',
      'collaborates with',
      'manages',
      'created'
    ]
  }
];
