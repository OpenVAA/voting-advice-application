import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OpenVAALogo from './OpenVAALogo.svelte';

/**
 * The classes on the rendered `<svg>`.
 * @param color - The `color` prop.
 * @returns The class list, split on whitespace.
 */
function svgClasses(color: 'primary' | 'secondary' | 'neutral'): Array<string> {
  const { body } = render(OpenVAALogo, { props: { color } });
  return (/<svg[^>]*\sclass="([^"]*)"/.exec(body)?.[1] ?? '').split(/\s+/).filter(Boolean);
}

describe('OpenVAALogo', () => {
  it.each(['primary', 'secondary', 'neutral'] as const)('names the %s fill once', (color) => {
    const classes = svgClasses(color);
    expect(classes.filter((c) => c === `fill-${color}`)).toHaveLength(1);
    expect(classes.filter((c) => c === 'inline')).toHaveLength(1);
  });
});
