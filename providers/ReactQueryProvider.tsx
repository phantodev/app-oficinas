import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Criar uma instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações padrão para queries
      retry: 1, // Tentar novamente apenas 1 vez em caso de erro
      refetchOnWindowFocus: false, // Não refazer fetch quando a janela ganha foco
      staleTime: 1000 * 60 * 5, // Considerar dados "frescos" por 5 minutos
    },
    mutations: {
      // Configurações padrão para mutations
      retry: 1,
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
