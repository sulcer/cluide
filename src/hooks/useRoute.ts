import type { Scope } from "@shared/api";
import { useParams } from "react-router";
import { decodeProject, type ScreenId } from "@/lib/routes";

export function useRoute(): { scope: Scope; screen: ScreenId | undefined; file: string | undefined } {
  const { project, screen, file } = useParams();
  return {
    scope: project === undefined ? "global" : decodeProject(project),
    screen: file !== undefined ? "hooks" : (screen as ScreenId | undefined),
    file,
  };
}
