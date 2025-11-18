import supertest from "supertest";
import { createServer } from "http";
import { URL } from "url";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { rootRouter } from "@ummati/api/src/root";
import { createContext } from "@ummati/api/src/context";
import { getAuthHeader } from "./auth";

/**
 * Create a test tRPC server for Supertest
 */
function createTestServer() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    
    if (url.pathname.startsWith("/trpc")) {
      const body = await getBody(req);
      
      const protocol = req.socket.encrypted ? "https:" : "http:";
      const host = req.headers.host || "localhost";
      const fullUrl = `${protocol}//${host}${req.url}`;
      
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }
      
      const fetchReq = new Request(fullUrl, {
        method: req.method || "GET",
        headers,
        body: body || undefined,
      });
      
      // Extract auth token from headers
      const authHeader = req.headers.authorization as string | undefined;
      const authToken = authHeader?.replace("Bearer ", "") || null;
      
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req: fetchReq,
        router: rootRouter,
        createContext: async () => {
          // Extract userId from token if valid
          let userId: string | null = null;
          if (authToken) {
            try {
              // For testing, we can decode the token to get userId
              // In real app, Clerk would verify this
              const jwt = require("jsonwebtoken");
              const decoded = jwt.decode(authToken) as any;
              userId = decoded?.sub || null;
            } catch (e) {
              // Invalid token, userId stays null
            }
          }
          
          return createContext({
            userId,
            authToken,
          });
        },
      });

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.statusCode = response.status;
      res.end(await response.text());
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return server;
}

function getBody(req: any): Promise<string | undefined> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body || undefined);
    });
  });
}

/**
 * Create Supertest client for tRPC API
 */
export function createTestClient() {
  const server = createTestServer();
  return supertest(server);
}

/**
 * Make authenticated tRPC request
 * tRPC HTTP requests use POST with procedure path and JSON body
 */
export async function trpcRequest(
  client: ReturnType<typeof createTestClient>,
  userId: string,
  email: string,
  procedure: string,
  input?: any
) {
  const authHeader = getAuthHeader(userId, email);
  
  // tRPC HTTP format: POST /trpc/procedure.name with JSON body
  const body = input ? JSON.stringify(input) : undefined;

  return client
    .post(`/trpc/${procedure}`)
    .set("Authorization", authHeader)
    .set("Content-Type", "application/json")
    .send(body);
}

