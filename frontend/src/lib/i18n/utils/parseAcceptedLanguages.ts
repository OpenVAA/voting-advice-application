/**
 * Parse the `Accept-Language` request header and return an ordered list
 * of preferred locales. The format of the header is as follows:
 * `fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5`
 * @param acceptLanguage The `Accept-Language` request header.
 * @returns An ordered list of preferred locale strings
 */
export function parseAcceptedLanguages(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(/\s*,\s*/)
    .map((l) => {
      const parts = l.split(/\s*;\s*/);
      let q = Infinity;
      if (parts.length > 1) {
        const match = parts[1].match(/\bq\s*=\s*([0-9.]+)\b/);
        if (match) {
          const qv = parseFloat(match[1]);
          if (!isNaN(qv)) q = qv;
        }
      }
      return [parts[0], q] as [string, number];
    })
    .sort((a, b) => b[1] - a[1])
    .map((lq) => lq[0]);
}
