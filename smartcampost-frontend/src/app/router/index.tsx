import AppRouter from "../../router/AppRouter";

// Temporary bridge: reuse existing AppRouter while we gradually
// move route definitions into the new routes.* files.
export default function Router() {
  return <AppRouter />;
}


