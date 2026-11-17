import { useState } from "react";
import { Formulario } from "../components/Formulario";
import { Tabela } from "../components/Tabela";
import {
  enviar,
  type Movimento,
  type Produto,
  type Usuario,
} from "../servicos/api";
import { useConsulta } from "../servicos/useConsulta";

export function Usuarios() {
  const { dados, erro, atualizar } = useConsulta<Usuario[]>("/usuarios");
  const [cadastrando, setCadastrando] = useState(false);
  const [busca, setBusca] = useState("");

  return (
    <>
      <div className="top">
        <h1>Usuários</h1>
        <button onClick={() => setCadastrando(true)}>+ Novo usuário</button>
      </div>
      {cadastrando && (
        <section>
          <h2>Novo usuário</h2>
          <Formulario
            acao="Salvar usuário"
            salvar={async (campos) => {
              if (campos.get("senha") !== campos.get("confirmacao"))
                throw new Error("As senhas precisam ser iguais.");

              await enviar("/usuarios", {
                usuario: campos.get("usuario"),
                email: campos.get("email"),
                senha: campos.get("senha"),
              });
              
              setCadastrando(false);
              atualizar();
            }}
          >
            <label>
              Usuário
              <input name="usuario" required />
            </label>
            <label>
              E-mail
              <input name="email" type="email" required />
            </label>
            <label>
              Senha
              <input
                name="senha"
                type="password"
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Confirme a senha
              <input
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                required
              />
            </label>
          </Formulario>
          <button className="sub" onClick={() => setCadastrando(false)}>
            Cancelar
          </button>
        </section>
      )}
      <div className="bar">
        <input
          aria-label="Buscar usuários"
          placeholder="Buscar por usuário ou e-mail"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
        />
      </div>
      {erro && <p role="alert">{erro}</p>}
      <section>
        <Tabela
          colunas={["Usuário", "E-mail"]}
          linhas={(dados ?? [])
            .filter((item) =>
              `${item.usuario} ${item.email}`
                .toLowerCase()
                .includes(busca.trim().toLowerCase()),
            )
            .map((item) => ({
              chave: item.usuario,
              celulas: [item.usuario, item.email],
            }))}
        />
      </section>
    </>
  );
}
