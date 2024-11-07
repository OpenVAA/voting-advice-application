/**
 * Any value allowed in JSON. Used to restrict dynamically fetched data.
 */
export type Serializable = string | number | boolean | null | Array<Serializable> | { [key: string]: Serializable };
