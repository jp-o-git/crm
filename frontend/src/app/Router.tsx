import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import ProtectedRoute from "../router/ProtectedRoute";
import PublicOnlyRoute from "../router/PublicOnlyRoute";
import LandingPage from "../pages/public/LandingPage";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import CompleteRegistration from "../pages/public/CompleteRegistration";
import NotFoundPage from "../pages/public/NotFoundPage";
import Dashboard from "../pages/private/Dashboard";
import ContactsPage from "../pages/private/Contact";
import ContactDetailPage from "../pages/private/ContactDetail";
import Report from "../pages/private/Report";
import OffersPage from "../pages/private/OfferPage";

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
