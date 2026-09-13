import type { ComponentProps } from "react";
import { cn } from "cn";
import { Switch as ShadcnSwitch } from "@/components/ui/switch";

// tokens.md Controls: 32×18 with a 14px shadowed thumb; shadcn's default is 32×18.4 with a 16px one.
export function Switch({ className, ...props }: ComponentProps<typeof ShadcnSwitch>) {
  return (
    <ShadcnSwitch
      className={cn("h-[18px] w-8 [&_[data-slot=switch-thumb]]:size-3.5 [&_[data-slot=switch-thumb]]:shadow-[0_1px_2px_rgba(0,0,0,.3)]", className)}
      {...props}
    />
  );
}
