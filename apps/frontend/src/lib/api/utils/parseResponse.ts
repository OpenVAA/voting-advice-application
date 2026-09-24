import { isRefusedResponse } from './isRefusedResponse';

/**
 * A typed utility for parsing the response based on the specified parser.
 *
 * A response the server refused is never parsed — it is thrown, ahead of the parser check, so no refusal can reach the switch below. This helper carries that contract ITSELF rather than trusting whoever calls it, because a helper that hands back the body of a refused response is a degrader: it turns a failure into a value the caller cannot tell apart from success, and every caller that does not know to check first inherits the hole. The refusal test is the same `isRefusedResponse` the adapter's own response check uses, so the two cannot drift into disagreeing about what a refusal is.
 * @param response - The response to parse.
 * @param parser - The parser to use.
 * @throws If the server refused the response, or if the parser is not a known one.
 */
export function parseResponse<TParser extends ResponseParser>(
  response: Response,
  parser: TParser
): ParsedResponse<TParser> {
  if (isRefusedResponse(response))
    throw new Error(`Refusing to parse a response the server refused: ${response.status}.`);

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
