import type { Colors, HasId, Image } from '../internal';

/**
 * Basic options for all `DataObject`s. The data types for all subclasses must extend this. The properties defined in this base interface are all optional and with the exception of `order` are included for convenience for use in the UI.
 */
export interface DataObjectData extends HasId {
  // From HasId
  // - id: Id;

  /**
   * A set of colors associated with the object, such as a theme color for a question category or a party’s brand color. @defaultValue null
   */
  color?: Colors | null;
  /**
   * An image associated with the object, such as a portrait for a person or a logo for a party. @defaultValue null
   */
  image?: Image | null;
  /**
   * The name of the object
   */
  name?: string | null;
  /**
   * Optional short name, which can be used in, e.g., lists and link titles. Defaults to name
   */
  shortName?: string | null;
  /**
   * Optional description of the object
   */
  info?: string | null;
  /**
   * When objects are returned in arrays, they are ordered by ascending `order`. Set to a small value to prioritise the object. @defaultValue Infinity
   */
  order?: number | null;
  /**
   * Optional arbitrary subtype that can be used to differentiate between objects of the same class, e.g. 'Constituency association' for an `Organization` that is not a party in an election where are parties are the default nominators. @defaultValue ''
   */
  subtype?: string | null;
  /**
   * Optional arbitrary data associated with the object.
   */
  customData?: object | null;
  /**
   * Whether the object is fully or partially automatically generated during data provision, such as `Alliance`s and `Nomination`s. @defaultValue false
   * If this is `true`, the `Id` validity check is bypassed, because it’s assumed to be generated as well.
   */
  isGenerated?: boolean | null;
}
