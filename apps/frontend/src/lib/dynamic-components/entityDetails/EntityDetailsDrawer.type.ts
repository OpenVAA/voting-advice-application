import type { DrawerProps } from '$lib/components/modal/drawer';
import type { EntityDetailsProps } from '.';

export type EntityDetailsDrawerProps = Partial<DrawerProps> & Pick<EntityDetailsProps, 'entity'>;
