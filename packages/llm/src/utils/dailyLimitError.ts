/**
 * Check if error indicates daily limit reached
 */
export function isDailyLimitError({ error }: { error: Error }): boolean {
  const errorMessage = error.message.toLowerCase();
  const dailyLimitPatterns = ['tpd', 'rpd', 'per day', 'daily limit', 'TPD', 'RPD']; // TODO: use better error message recognition?
  return dailyLimitPatterns.some(pattern => errorMessage.includes(pattern));
}