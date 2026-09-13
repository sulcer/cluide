import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

const input = cva("w-full min-w-0 border border-input bg-transparent placeholder:text-muted-foreground", {
  variants: { size: { sm: "h-7 rounded-sm px-2 text-xs", md: "h-8 rounded-md px-2.5 text-[13px]" } },
  defaultVariants: { size: "sm" },
});

export type InputProps = Omit<ComponentProps<"input">, "size"> & VariantProps<typeof input>;

export function Input({ className, size, ...props }: InputProps) {
  return <input className={cn(input({ size }), className)} {...props} />;
}

export function SearchInput({ className, ...props }: InputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-7" {...props} />
    </div>
  );
}
