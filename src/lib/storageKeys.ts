
'use client'; // Not strictly necessary for this file, but good practice if it were to include hooks.

export const APP_LOGGED_IN_USER_KEY = "remindme_logged_in_user";

/**
 * Generates a user-specific localStorage key.
 * @param baseKey The base key (e.g., "remindme_expenses").
 * @param email The user's email address.
 * @returns A string representing the user-specific key.
 */
export const getUserSpecificKey = (baseKey: string, email: string | null): string => {
  if (!email) {
    // This case should be handled by components before calling this function.
    // Returning a distinctly invalid key can help catch errors if email is unexpectedly null.
    console.warn(`getUserSpecificKey called with null email for baseKey: ${baseKey}. This is likely an issue.`);
    return `${baseKey}_USER_EMAIL_NULL_ERROR_INVALID_KEY`;
  }
  // Sanitize email to be a valid localStorage key part.
  // Replace @ with _at_, . with _dot_, and any other non-alphanumeric (excluding _) with _.
  const sanitizedEmail = email
    .replace(/@/g, "_at_")
    .replace(/\./g, "_dot_")
    .replace(/[^a-zA-Z0-9_]/g, '_');
  return `${baseKey}_${sanitizedEmail}`;
};
