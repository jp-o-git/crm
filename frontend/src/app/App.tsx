import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Provider } from "./Provider";
import { Router } from "./Router";

function App() {
  return (
    <Provider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50 text-blue-700">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
          </div>
        }
      >
        <RouterProvider router={Router} />
      </Suspense>
    </Provider>
  );
}

export default App;
