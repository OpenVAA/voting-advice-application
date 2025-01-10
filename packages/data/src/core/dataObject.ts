import { DataProvisionError, Updatable } from '../internal';
import type { Colors, DataAccessor, DataObjectData, DataRoot, Id, Image } from '../internal';

/**
 * Base class for all data objects. Note that we implement `DataAccessor<DataObjectData>` to make sure that wehave accessors for all of the properties in the object’s data.
 */
export abstract class DataObject<TData extends DataObjectData = DataObjectData>
  extends Updatable
  implements DataAccessor<DataObjectData>
{
  readonly data: TData;
  readonly root: DataRoot;

  constructor({ data, root }: { data: TData; root: DataRoot }) {
    if (!data.isGenerated && !root.checkId(data.id)) throw new DataProvisionError(`Invalid id: ${data.id}`);
    super();
    this.root = root;
    this.data = data;
    this.log(`Created with id: ${this.id}`);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * A set of colors associated with the object, such as a theme color for a question category or a party’s brand color. @defaultValue null
   */
  get color(): Colors | null {
    return this.data.color ?? null;
  }

  /**
   * Optional arbitrary data associated with the object. @defaultValue {}
   */
  get customData(): object {
    return this.data.customData ?? {};
  }

  /**
   * The object's id which must be unique within the data type
   */
  get id(): Id {
    return this.data.id;
  }

  /**
   * An image associated with the object, such as a portrait for a person or a logo for a party. @defaultValue null
   */
  get image(): Image | null {
    return this.data.image ?? null;
  }

  /**
   * Optional description of the object. @defaultValue ''
   */
  get info(): string {
    return this.data.info ?? '';
  }

  /**
   * Whether the object is automatically generated during data provision, such as `Alliance`s and some `Nomination` subtypes. @defaultValue false
   */
  get isGenerated(): boolean {
    return this.data.isGenerated ?? false;
  }

  /**
   * The object's name. @defaultValue ''
   */
  get name(): string {
    return this.data.name ?? '';
  }

  /**
   * When objects are returned in arrays, they are ordered by ascending `order`. Set to a small value to prioritise the object. @defaultValue Infinity
   */
  get order(): number {
    return this.data.order ?? Infinity;
  }

  /**
   * Optional short name, which can be used in, e.g., lists and link titles. @defaultValue `this.name`
   */
  get shortName(): string {
    return this.data.shortName || this.name;
  }

  /**
   * Optional arbitrary subtype that can be used to differentiate between objects of the same class, e.g. 'Constituency association' for an `Organization` that is not a party in an election where are parties are the default nominators. @defaultValue ''
   */
  get subtype(): string {
    return this.data.subtype ?? '';
  }

  //////////////////////////////////////////////////////////////////////////////
  // Debugging
  //////////////////////////////////////////////////////////////////////////////

  /**
   * If this object does not have the debug flag set, return the debug flag of the root.
   */
  get debug(): boolean | undefined {
    return this._debug ?? this.root.debug;
  }

  /**
   * Show an nice string representation of the object.
   */
  toString(): string {
    return `${this.constructor.name} '${this.name}' • id: ${this.id}`;
  }
}
