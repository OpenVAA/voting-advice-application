import { untrack } from 'svelte';
import { drawerHost } from '$lib/components/modal/drawerHost';
import { unwrapEntity } from '$lib/utils/entities';
import EntityDetails from './EntityDetails.svelte';

/**
 * Opens `EntityDetails` for the entity `getEntity` returns in the app's `DrawerHost` while it returns one, and closes it when it returns `undefined` or when the calling component is destroyed.
 *
 * Call it once, at component init. Switching to another entity while the drawer is open updates the open drawer in place rather than reopening it. The content renders from the last defined entity, because the host keeps rendering through its close animation after the getter already returns `undefined` (see spike 034).
 *
 * It takes a getter rather than a value, so a caller passes the reactive read itself and never destructures a context accessor.
 *
 * @param getEntity - Returns the possibly ranked entity to show, or `undefined` while the drawer should be closed.
 * @param onClose - Called when the user dismisses the drawer (close button, backdrop, Escape). A routed caller navigates back here, which makes `getEntity` return `undefined` and closes the drawer.
 */
export function openEntityDrawer(getEntity: () => MaybeWrappedEntityVariant | undefined, onClose: () => void): void {
  let latched = $state.raw<MaybeWrappedEntityVariant | undefined>();
  $effect.pre(() => {
    const entity = getEntity();
    if (entity) latched = entity;
  });

  // The payload getters only run once the pre-effect above has latched a defined entity, and the latch is never reset.
  function shownEntity(): MaybeWrappedEntityVariant {
    return latched!;
  }

  const isOpen = $derived(!!getEntity());

  $effect(() => {
    if (!isOpen) return;
    const key = drawerHost.newKey('entity');
    untrack(() =>
      drawerHost.open({
        key,
        title: () => unwrapEntity(shownEntity()).entity.name,
        component: EntityDetails,
        props: () => ({ entity: shownEntity(), class: 'min-h-full' }),
        onDismiss: onClose,
        // The results specs locate the drawer by this id.
        testId: 'voter-results-drawer'
      })
    );
    return () => drawerHost.close(key);
  });
}
