export function GetFullNameInOrder(firstName: string, lastName: string){
    // TODO: Get this value from settings
    let firstNameLastNameOrder: boolean = true;
    return firstNameLastNameOrder ? `${firstName} ${lastName}` : `${lastName} ${firstName}`;
}