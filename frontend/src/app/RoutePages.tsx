import { lazy } from "react";

export const LandingPage = lazy(() => import("../pages/public/LandingPage"));
export const Login = lazy(() => import("../pages/public/Login"));
export const Register = lazy(() => import("../pages/public/Register"));
export const CompleteRegistration = lazy(
  () => import("../pages/public/CompleteRegistration"),
);
export const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage"));
export const Dashboard = lazy(() => import("../pages/private/Dashboard"));
export const ContactsPage = lazy(() => import("../pages/private/Contact"));
export const ContactDetailPage = lazy(
  () => import("../pages/private/ContactDetail"),
);
export const Report = lazy(() => import("../pages/private/Report"));
export const OffersPage = lazy(() => import("../pages/private/OfferPage"));
