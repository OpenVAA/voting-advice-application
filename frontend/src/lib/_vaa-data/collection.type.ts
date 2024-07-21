import type {CanUpdate} from './internal';

export type Collectable = CanUpdate;

export type Collection<TObject extends Collectable = Collectable> = Array<TObject>;

export type MaybeCollection<TType extends Collectable> = Collection<TType> | undefined;
