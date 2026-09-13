import { useRoute } from "@/lib/useRoute";

export function Screen() {
  const route = useRoute();
  return <pre className="p-4 font-mono text-xs">{JSON.stringify(route, null, 2)}</pre>;
}
