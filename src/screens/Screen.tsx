import { Navigate } from "react-router";
import { useRoute } from "@/hooks/useRoute";
import { screenDef, screenUrl } from "@/lib/routes";
import { FilesScreen } from "./FilesScreen";
import { HooksScreen } from "./HooksScreen";
import { McpScreen } from "./McpScreen";
import { PluginsScreen } from "./PluginsScreen";
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
      return file === undefined ? (
        <HooksScreen key={key} scope={scope} />
      ) : (
        <FilesScreen key={`${key}/${file}`} scope={scope} kind="hooks" file={file} />
      );
    case "settings":
      return <SettingsScreen key={key} scope={scope} />;
    case "mcp":
      return <McpScreen key={key} scope={scope} />;
    case "plugins":
      return <PluginsScreen key={key} />;
    default:
      return <FilesScreen key={key} scope={scope} kind={def.kind!} />;
  }
}
