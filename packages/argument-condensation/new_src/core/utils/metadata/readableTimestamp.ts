/**
 * Returns a readable timestamp string in the format HHMM_DD_MM_YYYY
 * 
 * @param date - The date to format (defaults to current date)
 * @returns A timestamp string in the format HHMM_DD_MM_YYYY
 */
export function readableTimestamp(date: Date = new Date()): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const year = date.getFullYear();

  return `${hours}${minutes}_${day}_${month}_${year}`;
}
