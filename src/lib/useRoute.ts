import type { Scope } from "@shared/api";
import { useParams } from "react-router";
import { type ScreenId, decodeProject } from "./routes";

export function useRoute(): { scope: Scope; screen: ScreenId | undefined; file: string | undefined } {
  const { project, screen, file } = useParams();
  return {
    scope: project === undefined ? "global" : decodeProject(project),
    screen: file !== undefined ? "hooks" : (screen as ScreenId | undefined),
    file,
  };
}
