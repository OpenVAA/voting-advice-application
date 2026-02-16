import { ucFirst } from '$lib/utils/text/ucFirst';

export function splitLabel(label: string) {
  const match = label.match(/^(.*?)(?:\s*\((.*)\))?\s*$/);
  return match ? [match[1], ucFirst(match[2] ?? '')] : [label, ''];
}
