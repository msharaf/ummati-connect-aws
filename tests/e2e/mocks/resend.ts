/**
 * Mock Resend email service for tests
 */

export interface MockEmail {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const mockSentEmails: MockEmail[] = [];

/**
 * Reset mock email inbox
 */
export function resetMockEmails(): void {
  mockSentEmails.length = 0;
}

/**
 * Get all sent emails
 */
export function getMockEmails(): MockEmail[] {
  return [...mockSentEmails];
}

/**
 * Get emails sent to a specific address
 */
export function getMockEmailsTo(email: string): MockEmail[] {
  return mockSentEmails.filter((e) => e.to === email);
}

/**
 * Mock send email function
 */
export async function mockSendEmail(email: MockEmail): Promise<void> {
  mockSentEmails.push({
    ...email,
    from: email.from || "notifications@ummati.com",
  });
  
  // In tests, we just log instead of actually sending
  console.log(`[MOCK EMAIL] To: ${email.to}, Subject: ${email.subject}`);
}

/**
 * Check if email was sent
 */
export function wasEmailSent(to: string, subject?: string): boolean {
  const emails = getMockEmailsTo(to);
  if (!subject) {
    return emails.length > 0;
  }
  return emails.some((e) => e.subject === subject);
}

