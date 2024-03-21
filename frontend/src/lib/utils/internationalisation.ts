/**
 * Return the name of the person in a locale-based order.
 * TODO: Use locale to define the order.
 * @param firstName
 * @param lastName
 * @returns
 */
export function formatName({firstName, lastName}: NameValues) {
  return `${firstName} ${lastName}`;
}

interface NameValues {
  firstName: string;
  lastName: string;
}
