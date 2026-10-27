import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import ProtectedRoute from "../router/ProtectedRoute";
import PublicOnlyRoute from "../router/PublicOnlyRoute";
import {
  CompleteRegistration,
  ContactDetailPage,
  ContactsPage,
  Dashboard,
  LandingPage,
  Login,
  NotFoundPage,
  OffersPage,
  Register,
  Report,
} from "./RoutePages";

export const Router = createBrowserRouter([
  // Logged-out visitors only. The landing page uses the public navigation;
  // logged-in users are sent to /dashboard.
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/register/complete", element: <CompleteRegistration /> },
    ],
  },

  // Logged-in users only, with authenticated navigation and footer.
  // Logged-out visitors are sent to /login.
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "contacts", element: <ContactsPage /> },
          { path: "contacts/:id", element: <ContactDetailPage /> },
          { path: "reports", element: <Report /> },
          { path: "offers", element: <OffersPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);
