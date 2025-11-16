/* eslint-disable react/no-children-prop */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { getTrpcClientConfig, trpc } from "../lib/trpcClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient(getTrpcClientConfig())
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient} children={children} />
    </trpc.Provider>
  );
}

