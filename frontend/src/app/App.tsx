import { RouterProvider } from "react-router-dom";
import { Provider } from "./Provider";
import { Router } from "./Router";

function App() {
  return (
    <Provider>
      <RouterProvider router={Router} />
    </Provider>
  );
}

export default App;
