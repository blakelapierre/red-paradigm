import { createFileRoute } from "@tanstack/react-router";
import { Council } from "@/components/climate/council";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Council />;
}
