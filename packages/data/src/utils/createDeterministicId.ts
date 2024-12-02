import {
  AnyNominationVariantData,
  EntityType,
  Id,
  PublicAllianceNominationData,
  PublicFactionNominationData
} from '../internal';

/**
 * Create a deterministic `Id` for dynamically created objects – implied `Alliance`s or `Faction`s, or `Nomination`s – based on their hashed properties.
 * @param prefix - A string used to prefix and join the parts of the `Id`. It cannot appear in any of the properties.
 * @param type - The type of object to be created.
 * @param data - The properties of the object to be hashed.
 * @returns A deterministic `Id` for the object.
 */
export function createDeterministicId<TType extends DynamicObjectType>({
  prefix,
  type,
  data
}: {
  prefix: string;
  type: TType;
  data: IdentityProps[TType];
}): Id {
  // Pick properties that vary by object type
  let otherProps: Array<Id> | [EntityType, Id];
  switch (type) {
    case 'nomination':
      otherProps = [data.entityType, (data as AnyNominationVariantData).entityId];
      break;
    case 'alliance':
      otherProps = [...(data as PublicAllianceNominationData).organizations.map((o) => o.entityId)].sort();
      break;
    case 'faction':
      otherProps = [...(data as PublicFactionNominationData).candidates.map((o) => o.entityId)].sort();
      break;
    default:
      throw new Error(`Invalid type "${type}". Expected "alliance", "faction", or "nomination".`);
  }

  // Create a string representation of the properties
  const stringProps = [
    prefix,
    type,
    data.electionId,
    data.constituencyId,
    data.electionRound ?? 1,
    data.parentNominationId ?? `${prefix}NONE`,
    ...otherProps
  ].join(prefix);

  // Create a hash of the string. We can't use the hash functions provided by `crypto` or `SubtleCrypto` because their availability is limited
  return `auto_${cyrb53(stringProps)}`;
}

/**
 * cyrb53 (c) 2018 bryc (github.com/bryc)
 * License: Public domain (or MIT if needed). Attribution appreciated.
 * A fast and simple 53-bit string hash function with decent collision resistance. Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
 * Source: https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export type DynamicObjectType = 'alliance' | 'faction' | 'nomination';

export type IdentityProps = {
  alliance: PublicAllianceNominationData;
  faction: PublicFactionNominationData;
  nomination: {
    entityType: EntityType;
    entityId: Id;
    electionId: Id;
    electionRound?: number | null;
    constituencyId: Id;
    parentNominationId?: Id | null;
  };
};
