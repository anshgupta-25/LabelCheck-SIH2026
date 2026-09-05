import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Batch checking now lives on /scan (drop several photos). This route only
 * survives so links shared before the merge keep working.
 */
export const Route = createFileRoute("/batch")({
  beforeLoad: () => {
    throw redirect({ to: "/scan", replace: true });
  },
  component: () => null,
});
