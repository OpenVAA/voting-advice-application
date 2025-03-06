export type EntityType = 'candidate' | 'party';
export type EntityApi<TEntity extends EntityType> = TEntity extends 'candidate'
  ? 'api::candidate.candidate'
  : 'api::party.party';
export type EntityData<TEntity extends EntityType> = Data.ContentType<EntityApi<TEntity>>;
