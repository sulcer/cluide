import { createBrowserRouter, Navigate } from "react-router";
import { Screen } from "./screens/Screen";
import { Shell } from "./shell/Shell";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/global/settings" replace /> },
  {
    element: <Shell />,
    children: [
      { path: "/global/:screen", element: <Screen /> },
      { path: "/global/hooks/:file", element: <Screen /> },
      { path: "/p/:project/:screen", element: <Screen /> },
      { path: "/p/:project/hooks/:file", element: <Screen /> },
    ],
  },
  { path: "*", element: <Navigate to="/global/settings" replace /> },
]);
