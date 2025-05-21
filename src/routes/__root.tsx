import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useState } from "react";

const queryClient = new QueryClient();

let isOpen = false;

export const Route = createRootRoute({
  loader: () => {
    isOpen = localStorage.getItem("sidebar-open") === "true";
  },
  component: () => {
    const [sidebarOpen, setSidebarOpen] = useState(isOpen);

    const handleSidebarOpenChange = (open: boolean) => {
      setSidebarOpen(open);
      localStorage.setItem("sidebar-open", String(open));
    };

    return (
      <>
        <TanStackRouterDevtools />

        <NuqsAdapter>
          <SidebarProvider
            open={sidebarOpen}
            onOpenChange={handleSidebarOpenChange}
          >
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
