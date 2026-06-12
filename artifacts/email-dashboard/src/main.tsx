import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" themes={["light", "dark", "amoled"]} disableTransitionOnChange>
    <App />
  </ThemeProvider>
);
