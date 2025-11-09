/**
 * Used for testConditions.
 * Source: https://stackoverflow.com/a/61132308
 */
export type DeepPartial<TObject> = TObject extends object
  ? {
      [KProp in keyof TObject]?: DeepPartial<TObject[KProp]>;
    }
  : TObject;
