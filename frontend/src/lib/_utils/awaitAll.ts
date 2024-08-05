/**
 * Performs `callback` when all of the inputs are either resolved if `Promise`s or not nullish if other objects. Use this in a reactive block to await for all inputs and listen to changes in stores.
 * @param inputs An array of `Promise`s and other values, usually store values
 * @param callback A function that receives the resolved values
 * @returns A `Promise` with either the result of `callback` or `undefined` if some inputs are nullish
 */
export async function awaitAll<TInputs extends Inputs, TReturn>(
  inputs: TInputs,
  callback: (data: Resolved<TInputs>) => TReturn
): Promise<TReturn | undefined> {
  if (Object.values(inputs).every((o) => !!o))
    return Promise.all(Object.values(inputs)).then((data) => callback(data as Resolved<TInputs>));
  return Promise.resolve(undefined);
}

type Inputs = [unknown, ...Array<unknown>] | Array<unknown>;

type Resolved<TInputs extends Inputs> = {
  [Key in keyof TInputs]: TInputs[Key] extends Promise<infer U> ? U : NonNullable<TInputs[Key]>;
};
