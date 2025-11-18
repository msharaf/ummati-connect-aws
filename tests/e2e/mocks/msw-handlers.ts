import { http, HttpResponse } from "msw";

/**
 * MSW handlers for mocking external services in E2E tests
 */

export const handlers = [
  // Mock Clerk API endpoints
  http.post("https://api.clerk.dev/v1/sessions/*/tokens", () => {
    return HttpResponse.json({
      jwt: "mock-jwt-token",
      object: "session_token",
    });
  }),

  http.get("https://api.clerk.dev/v1/users/*", ({ params }) => {
    const userId = params[0];
    
    // Return mock user based on test user ID pattern
    if (userId.includes("founder")) {
      return HttpResponse.json({
        id: userId,
        email_addresses: [{ email_address: "founder@test.com" }],
        first_name: "Test",
        last_name: "Founder",
      });
    }
    
    if (userId.includes("investor")) {
      return HttpResponse.json({
        id: userId,
        email_addresses: [{ email_address: "investor@test.com" }],
        first_name: "Test",
        last_name: "Investor",
      });
    }
    
    return HttpResponse.json({
      id: userId,
      email_addresses: [{ email_address: "user@test.com" }],
    });
  }),

  // Mock Resend API
  http.post("https://api.resend.com/emails", async ({ request }) => {
    const body = await request.json();
    console.log("[MSW MOCK] Email would be sent:", body);
    return HttpResponse.json({
      id: "mock-email-id",
      from: "notifications@ummati.com",
      to: (body as any).to,
      created_at: new Date().toISOString(),
    });
  }),

  // Mock Expo Push Notification service
  http.post("https://exp.host/--/api/v2/push/send", async ({ request }) => {
    const body = await request.json();
    console.log("[MSW MOCK] Push notification would be sent:", body);
    return HttpResponse.json({
      data: {
        status: "ok",
        id: "mock-push-id",
      },
    });
  }),
];

