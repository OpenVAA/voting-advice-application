/**
 * A typed utility for parsing the response based on the specified parser.
 * @param response - The response to parse.
 * @param parser - The parser to use.
 */
export function parseResponse<TParser extends ResponseParser>(
  response: Response,
  parser: TParser
): ParsedResponse<TParser> {
  switch (parser) {
    case 'json':
      return response.json() as ParsedResponse<TParser>;
    case 'text':
      return response.text() as ParsedResponse<TParser>;
    case 'blob':
      return response.blob() as ParsedResponse<TParser>;
    case 'none':
      return response as unknown as ParsedResponse<TParser>;
    default:
      throw new Error(`Invalid parse option: ${parser}`);
  }
}
export type ResponseParser = 'json' | 'text' | 'blob' | 'none' | undefined;
/**
 * The parsed response based on the specified parser.
 */

export type ParsedResponse<TParser extends ResponseParser> = TParser extends 'json' | undefined
  ? Promise<unknown>
  : TParser extends 'text'
    ? Promise<string>
    : TParser extends 'blob'
      ? Promise<Blob>
      : TParser extends 'none'
        ? Response
        : never;
