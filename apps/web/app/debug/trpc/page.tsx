"use client";

import { trpc } from "../../../src/lib/trpc";

export default function TRPCDebugPage() {
  const { data, isLoading, error } = trpc.auth.getSessionUser.useQuery();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">tRPC Debug Page</h1>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Status:</h2>
            {isLoading && (
              <p className="text-blue-600">Loading tRPC query...</p>
            )}
            {error && (
              <div className="rounded bg-red-50 p-4">
                <p className="font-semibold text-red-800">Error:</p>
                <p className="text-red-600">{error.message}</p>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            )}
            {data !== undefined && !error && (
              <p className="text-green-600">✓ tRPC connection successful!</p>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Response Data:</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Test Query:</h2>
            <p className="text-sm text-gray-600">
              <code>trpc.auth.getSessionUser.useQuery()</code>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              This is a public procedure that returns the current session user
              (null if not authenticated).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

