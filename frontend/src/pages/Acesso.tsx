import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formulario } from "../components/Formulario";
import { enviar } from "../servicos/api";

export function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const navegar = useNavigate();

  return (
    <main className="acesso">
      <section>
        <h1>Controle de Estoque</h1>
        <h2>Entrar</h2>
        <Formulario
          acao="Entrar"
          salvar={async (campos) => {
            await enviar("/login", {
              usuario: campos.get("usuario"),
              senha: campos.get("senha"),
            });
            aoEntrar();
            navegar("/", { replace: true });
          }}
        >
          <label>
            Usuário
            <input name="usuario" autoComplete="username" required />
          </label>
          <label>
            Senha
            <input
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        </Formulario>
        <Link to="/recuperacao">Esqueci minha senha</Link>
      </section>
    </main>
  );
}

export function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const navegar = useNavigate();

  return (
    <main className="acesso">
      <section>
        <h1>Recuperar senha</h1>
        {!email ? (
          <Formulario
            acao="Enviar código"
            salvar={async (campos) => {
              const endereco = String(campos.get("email")).trim();
              await enviar("/recuperacao", { email: endereco });
              
              setEmail(endereco);
            }}
          >
            <label>
              E-mail cadastrado
              <input name="email" type="email" required />
            </label>
          </Formulario>
        ) : (
          <>
            <p>Se houver uma conta com esse e-mail, você receberá um código.</p>
            <Formulario
              acao="Salvar nova senha"
              salvar={async (campos) => {
                if (campos.get("senha") !== campos.get("confirmacao"))
                  throw new Error("As senhas precisam ser iguais.");

                await enviar("/redefinicao", {
                  email,
                  codigo: campos.get("codigo"),
                  senha: campos.get("senha"),
                });

                navegar("/login", { replace: true });
              }}
            >
              <label>
                Código recebido
                <input name="codigo" autoComplete="one-time-code" required />
              </label>
              <label>
                Nova senha
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
          </>
        )}
        <Link to="/login">Voltar ao login</Link>
      </section>
    </main>
  );
}
