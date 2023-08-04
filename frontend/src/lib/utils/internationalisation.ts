export function GetFullNameInOrder(firstName: string, lastName: string) {
  // TODO: Get this value from settings
  const firstNameLastNameOrder = true;
  return firstNameLastNameOrder ? `${firstName} ${lastName}` : `${lastName} ${firstName}`;
}
