import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { MenuLateral } from "../components/MenuLateral";
import { Login, RecuperarSenha } from "../pages/Acesso";
import { Historico } from "../pages/Historico";
import { NovaMovimentacao } from "../pages/NovaMovimentacao";
import { Painel } from "../pages/Painel";
import { Produtos } from "../pages/Produtos";
import { Usuarios } from "../pages/Usuarios";
import { consultar, enviar } from "../servicos/api";

export function Rotas() {
  const [autenticado, setAutenticado] = useState<boolean>();
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controle = new AbortController();
    consultar<{ autenticado: boolean }>("/sessao", controle.signal)
      .then((sessao) => setAutenticado(sessao.autenticado))
      .catch((falha: Error) => {
        if (!controle.signal.aborted) 
          setErro(falha.message);
      });

    return () => controle.abort();
  }, []);

  if (autenticado === undefined)
    return (
      <main>
        <p>{erro || "Verificando sessão…"}</p>
      </main>
    );

  async function sair() {
    try {
      await enviar("/sair");
      setAutenticado(false);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Falha ao sair.");
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            autenticado ? (
              <Navigate to="/" replace />
            ) : (
              <Login aoEntrar={() => setAutenticado(true)} />
            )
          }
        />
        <Route
          path="/recuperacao"
          element={
            autenticado ? <Navigate to="/" replace /> : <RecuperarSenha />
          }
        />
        <Route
          element={
            autenticado ? (
              <div className="layout">
                <MenuLateral sair={sair} />
                <main>
                  {erro && <p role="alert">{erro}</p>}
                  <Outlet />
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Painel />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/movimentacao" element={<NovaMovimentacao />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
