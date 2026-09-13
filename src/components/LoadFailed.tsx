import { CircleAlert } from "lucide-react";
import type { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { Centered } from "@/components/Centered";

interface Props { what: string; error: ApiError; onRetry: () => void }

// The centred state a list or document screen shows when its one read comes back with a status
// (an unknown scope, an unparsable .mcp.json) instead of data. A network failure never reaches
// here: client.ts turns that into cluide:offline and the shell's offline banner covers it instead.
export function LoadFailed({ what, error, onRetry }: Props) {
  return (
    <Centered icon={CircleAlert} title={`${what} could not be loaded`} path={error.status ? `${error.status} · ${error.message}` : error.message}>
      <Button onClick={onRetry}>Retry</Button>
    </Centered>
  );
}
