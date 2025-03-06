/**
 * Make an authorized POST request to the specified API endpoint.
 */
export function apiPost(url: string, data: Record<string, unknown>): Promise<Response> {
  const jwtToken = sessionStorage.getItem('jwtToken');
  if (!jwtToken) throw new Error('No JWT token found');
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwtToken.replaceAll('"', '')}`,
    },
    body: JSON.stringify(data),
  });
}
