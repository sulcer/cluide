const WIDTHS = [62, 48, 71, 55, 40, 66];

export function SkeletonRows() {
  return (
    <div className="p-2" aria-hidden>
      {WIDTHS.map((w) => (
        <div key={w} className="flex h-8 items-center gap-2 px-2">
          <div className="size-4 animate-pulse rounded-sm bg-muted [animation-duration:1.6s]" />
          <div className="h-3 animate-pulse rounded-sm bg-muted [animation-duration:1.6s]" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}
