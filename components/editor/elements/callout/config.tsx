import { SVGProps } from 'react';

const defaultProps: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '16',
  height: '16',
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
type SvgParams = { className: string };

export const calloutConfig = {
  note: {
    defaultTitle: 'Note',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <line x1="18" y1="2" x2="22" y2="6"></line>
        <path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"></path>
      </svg>
    ),
    colors: { background: 'bg-blue-500/20', text: 'text-blue-500 placeholder:text-blue-500', svg: 'stroke-blue-500' },
  },
  tip: {
    defaultTitle: 'Tip',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
      </svg>
    ),
    colors: { background: 'bg-cyan-500/20', text: 'text-cyan-500 placeholder:text-cyan-500', svg: 'stroke-cyan-500' },
  },
  warning: {
    defaultTitle: 'Warning',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    colors: {
      background: 'bg-orange-500/20',
      text: 'text-orange-400 placeholder:text-orange-400',
      svg: 'stroke-orange-400',
    },
  },
  abstract: {
    defaultTitle: 'Abstract',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"></path>
        <path d="M12 11h4"></path>
        <path d="M12 16h4"></path>
        <path d="M8 11h.01"></path>
        <path d="M8 16h.01"></path>
      </svg>
    ),
    colors: { background: 'bg-cyan-500/20', text: 'text-cyan-500 placeholder:text-cyan-500', svg: 'stroke-cyan-500' },
  },
  info: {
    defaultTitle: 'Info',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    ),
    colors: { background: 'bg-blue-500/20', text: 'text-blue-500 placeholder:text-blue-500', svg: 'stroke-blue-500' },
  },
  todo: {
    defaultTitle: 'Todo',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    ),
    colors: { background: 'bg-blue-500/20', text: 'text-blue-500 placeholder:text-blue-500', svg: 'stroke-blue-500' },
  },
  success: {
    defaultTitle: 'Success',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
    colors: {
      background: 'bg-green-500/20',
      text: 'text-green-500 placeholder:text-green-500',
      svg: 'stroke-green-500',
    },
  },
  question: {
    defaultTitle: 'Question',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    colors: {
      background: 'bg-yellow-500/20',
      text: 'text-yellow-500 placeholder:text-yellow-500',
      svg: 'stroke-yellow-500',
    },
  },
  failure: {
    defaultTitle: 'Failure',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    ),
    colors: { background: 'bg-red-500/20', text: 'text-red-500 placeholder:text-red-500', svg: 'stroke-red-500' },
  },
  danger: {
    defaultTitle: 'Danger',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    ),
    colors: { background: 'bg-red-500/20', text: 'text-red-500 placeholder:text-red-500', svg: 'stroke-red-500' },
  },
  bug: {
    defaultTitle: 'Bug',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <rect x="8" y="6" width="8" height="14" rx="4"></rect>
        <path d="m19 7-3 2"></path>
        <path d="m5 7 3 2"></path>
        <path d="m19 19-3-2"></path>
        <path d="m5 19 3-2"></path>
        <path d="M20 13h-4"></path>
        <path d="M4 13h4"></path>
        <path d="m10 4 1 2"></path>
        <path d="m14 4-1 2"></path>
      </svg>
    ),
    colors: { background: 'bg-red-500/20', text: 'text-red-500 placeholder:text-red-500', svg: 'stroke-red-500' },
  },
  example: {
    defaultTitle: 'Example',
    svg: ({ className }: SvgParams) => (
      <svg className={className} {...defaultProps}>
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    ),
    colors: {
      background: 'bg-purple-500/20',
      text: 'text-purple-400 placeholder:text-purple-400',
      svg: 'stroke-purple-400',
    },
  },
  quote: {
    defaultTitle: 'Quote',
    svg: ({ className }: SvgParams) => (
      <svg viewBox="0 0 100 100" width="16" height="16" className={className}>
        <path d="M16.7,13.3c-3.7,0-6.7,3-6.7,6.7v26.7c0,3.7,3,6.7,6.7,6.7h13.5c0.1,6-0.5,18.7-6.3,28.2c0,0,0,0,0,0 c-0.9,1.4-0.7,3.1,0.5,4.2c1.2,1.1,3,1.2,4.3,0.2c0,0,14.7-11.2,14.7-32.7V20c0-3.7-3-6.7-6.7-6.7L16.7,13.3z M63.3,13.3 c-3.7,0-6.7,3-6.7,6.7v26.7c0,3.7,3,6.7,6.7,6.7h13.5c0.1,6-0.5,18.7-6.3,28.2h0c-0.9,1.4-0.7,3.1,0.5,4.2c1.2,1.1,3,1.2,4.3,0.2 c0,0,14.7-11.2,14.7-32.7V20c0-3.7-3-6.7-6.7-6.7L63.3,13.3z"></path>
      </svg>
    ),
    colors: {
      background: 'bg-gray-500/20',
      text: 'text-gray-400 placeholder:text-gray-400',
      svg: 'fill-gray-400 stroke-gray-400',
    },
  },
};

export type CalloutType = keyof typeof calloutConfig;
