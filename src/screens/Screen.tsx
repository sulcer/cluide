import { Navigate } from "react-router";
import { screenDef, screenUrl } from "@/lib/routes";
import { useRoute } from "@/lib/useRoute";
import { FilesScreen } from "./FilesScreen";
import { HooksScreen } from "./HooksScreen";
import { SettingsScreen } from "./SettingsScreen";

export function Screen() {
  const { scope, screen, file } = useRoute();
  const def = screenDef(screen);
  if (def === undefined || (def.globalOnly && scope !== "global")) {
    return <Navigate to={screenUrl(scope, "settings")} replace />;
  }
  const key = `${scope}/${def.id}`;
  switch (def.id) {
    case "hooks":
      return file === undefined ? <HooksScreen key={key} scope={scope} /> : <FilesScreen key={`${key}/${file}`} scope={scope} kind="hooks" file={file} />;
    case "settings":
      return <SettingsScreen key={key} scope={scope} />;
    case "mcp":
    case "plugins":
      return <Soon key={key} name={def.label} />;
    default:
      return <FilesScreen key={key} scope={scope} kind={def.kind!} />;
  }
}

// Replaced screen by screen in Tasks 6 to 9.
const Soon = ({ name }: { name: string }) => <div className="p-4 text-xs text-muted-foreground">{name}</div>;
