import { Outlet } from "react-router";

export function Shell() {
  return (
    <div className="flex h-full">
      <aside className="w-60 border-r border-sidebar-border bg-sidebar" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="h-10 border-b" />
        <main className="min-h-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
