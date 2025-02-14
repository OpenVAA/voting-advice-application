/**
 * Construct a mailto link with the subject, metadata and body of the email.
 * @param subject - The subject of the email
 * @param to - The email address to send the email to
 * @param body - The body of the email
 * @param includeMetadata - If `true`, include metadata in the email, such as date, URL, and user agent.
 * @returns The constructed mailto link as a string.
 */
export function getEmailUrl({
  subject,
  to,
  body = '',
  includeMetadata = true
}: {
  subject: string;
  to: string;
  body?: string;
  includeMetadata?: boolean;
}): string {
  const start = `mailto:${to}?subject=${encodeURIComponent(subject)}`;
  let end = '';
  if (includeMetadata) {
    end = `\n\nDate: ${new Date()}`;
    end += `\nURL: ${window?.location?.href ?? '-'}`;
    if (navigator?.userAgent) end += `\nUser Agent: ${navigator?.userAgent ?? '-'}`;
    end = encodeURIComponent(end);
  }
  // Truncate description if the url would get too long so that we don't get an error when sending the email. See https://stackoverflow.com/questions/13317429/mailto-max-length-of-each-internet-browsers/33041454#33041454
  // We need to check the length after encoding all the parts
  let mailto = '';
  let trimmedDescription = body.replaceAll(/(\n *)+/g, '\n').substring(0, 1850);
  while (!mailto || mailto.length > 1900) {
    mailto = `${start}&body=${encodeURIComponent(trimmedDescription)}${end}`;
    // Trim the description in chunks of 10 characters. We don't want to truncate the encoded string, because it might get corrupted if trim in the middle of an encoded character
    trimmedDescription = trimmedDescription.substring(0, trimmedDescription.length - 10);
  }
  return mailto;
}
