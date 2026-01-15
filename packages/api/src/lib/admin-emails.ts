/**
 * List of emails that should automatically be granted admin status
 * These users will be set as admins when they are created in the database
 */

export const ADMIN_EMAILS = [
  "rifatc100@gmail.com",
  "mouhabsharaf@gmail.com",
  "khairul.nual@gmail.com"
] as const;

/**
 * Check if an email should be granted admin status
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email as any);
}
