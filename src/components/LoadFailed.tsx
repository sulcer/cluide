import { CircleAlert } from "lucide-react";
import type { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { Centered } from "@/components/Centered";

interface Props { what: string; error: ApiError; onRetry: () => void }

// A read that failed with a status; a network failure is the shell's offline banner instead.
export function LoadFailed({ what, error, onRetry }: Props) {
  return (
    <Centered icon={CircleAlert} title={`${what} could not be loaded`} path={error.status ? `${error.status} · ${error.message}` : error.message}>
      <Button onClick={onRetry}>Retry</Button>
    </Centered>
  );
}
