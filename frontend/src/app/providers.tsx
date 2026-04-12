"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import ApiKeyModal from "@/components/onboarding/ApiKeyModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiKeyModal />
      {children}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
