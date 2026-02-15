'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos - dados ficam frescos
            gcTime: 1000 * 60 * 30, // 30 minutos - cache mantido
            refetchOnWindowFocus: false, // Não recarregar ao focar janela
            refetchOnMount: false, // Não recarregar ao montar se tiver cache
            retry: 1, // Tentar apenas 1 vez em caso de erro
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
