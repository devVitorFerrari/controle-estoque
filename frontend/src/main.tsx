import { createRoot } from "react-dom/client";
import { Rotas } from "./router/Rotas";
import "./estilos.css";

createRoot(document.getElementById("raiz")!).render(<Rotas />);
