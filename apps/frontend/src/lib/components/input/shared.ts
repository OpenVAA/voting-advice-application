/**
 * Shared constants between the `Input` and `InputGroup` components and the `Input` parts in `./parts`.
 *
 * The element classes below were private to `Input.svelte` until its four complex markup branches were extracted into parts. Both sides need them — the parts render the extracted branches, `Input` still renders the two single-element branches inline — so they live here rather than being duplicated or threaded through as props.
 */
export const iconBadgeClass = 'my-auto flex-shrink-0';
export const infoClass = 'm-md small-info';
export const joinGap = 'gap-xs';
export const outsideLabelClass = 'font-bold text-secondary mx-md mb-8 mt-lg';
