export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * RED-phase stub — intentionally returns target unchanged so the unit tests in
 * mergeSettings.test.ts fail before the GREEN-phase implementation lands.
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  _source: TSource
): TTarget & TSource {
  return target as TTarget & TSource;
}
