import { CalloutType } from 'components/editor/elements/callout/config';
import { calloutTypes } from './';

// escape regex special characters
export function escapeRegExp(s: string) {
  return s.replace(new RegExp(`[-[\\]{}()*+?.\\\\^$|/]`, 'g'), '\\$&');
}

export function calloutTypeFromKeyword(keyword: string, types: { [index: string]: string | object }): CalloutType {
  return (typeof types[keyword] === 'string' ? String(types[keyword]) : keyword) as CalloutType;
}

// Finds callout elements in input string and styles them
export function decorateCallouts(input: string) {
  const parsed = new DOMParser().parseFromString(input, 'text/html');
  const callouts = parsed.getElementsByClassName('callout');

  for (const callout of callouts) {
    const keyword = Array.from(callout.classList).find(c => c !== 'callout') ?? 'note';
    const calloutDetails: { [index: string]: string } = {};
    Object.assign(calloutDetails, calloutTypes[calloutTypeFromKeyword(keyword, calloutTypes)]);

    const title = callout.firstElementChild;
    const content = callout.lastElementChild;
    const iconWrapper = title?.firstElementChild;
    const svg = new DOMParser().parseFromString(calloutDetails.svg, 'image/svg+xml').getElementsByTagName('svg')[0];

    title?.setAttribute('style', `background-color: ${calloutDetails.color}2a;`);
    callout?.setAttribute('style', `border-left-color: ${calloutDetails.color};`);
    iconWrapper?.setAttribute('style', `color: ${calloutDetails.color};`);
    iconWrapper?.appendChild(svg);

    if (content?.classList.contains('nested')) {
      content?.setAttribute(
        'style',
        `border-right: 1px solid ${calloutDetails.color}33;
         border-bottom: 1px solid ${calloutDetails.color}33;`,
      );
    }
  }

  return parsed.body.innerHTML;
}
