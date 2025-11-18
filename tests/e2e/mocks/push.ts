/**
 * Mock push notification service for tests
 */

export interface MockPushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

const mockSentNotifications: MockPushNotification[] = [];

/**
 * Reset mock notification queue
 */
export function resetMockNotifications(): void {
  mockSentNotifications.length = 0;
}

/**
 * Get all sent notifications
 */
export function getMockNotifications(): MockPushNotification[] {
  return [...mockSentNotifications];
}

/**
 * Get notifications sent to a specific token
 */
export function getMockNotificationsTo(token: string): MockPushNotification[] {
  return mockSentNotifications.filter((n) => n.token === token);
}

/**
 * Mock send push notification function
 */
export async function mockSendPush(notification: MockPushNotification): Promise<void> {
  mockSentNotifications.push(notification);
  
  // In tests, we just log instead of actually sending
  console.log(`[MOCK PUSH] Token: ${notification.token.substring(0, 20)}..., Title: ${notification.title}`);
}

/**
 * Check if notification was sent
 */
export function wasNotificationSent(token: string, title?: string): boolean {
  const notifications = getMockNotificationsTo(token);
  if (!title) {
    return notifications.length > 0;
  }
  return notifications.some((n) => n.title === title);
}

