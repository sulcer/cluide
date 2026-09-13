import {
  Bot,
  Brain,
  Keyboard,
  ListChecks,
  type LucideIcon,
  Puzzle,
  Server,
  Settings,
  Sparkles,
  SquareTerminal,
  Webhook,
} from "lucide-react";
import type { ScreenId } from "./routes";

const ICONS: Record<ScreenId, LucideIcon> = {
  settings: Settings,
  memory: Brain,
  rules: ListChecks,
  keybindings: Keyboard,
  agents: Bot,
  skills: Sparkles,
  commands: SquareTerminal,
  hooks: Webhook,
  plugins: Puzzle,
  mcp: Server,
};

export function ScreenIcon({ id, className }: { id: ScreenId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} />;
}
