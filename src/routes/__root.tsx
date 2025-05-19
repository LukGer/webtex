import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { NuqsAdapter } from "nuqs/adapters/react";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <TanStackRouterDevtools />

        <NuqsAdapter>
          <SidebarProvider>
            <TooltipProvider>
              <QueryClientProvider client={queryClient}>
                <Outlet />
              </QueryClientProvider>
            </TooltipProvider>
          </SidebarProvider>
        </NuqsAdapter>
      </>
    );
  },
});
