import { useState, type ReactNode } from "react";

export function Formulario({
  children,
  acao,
  salvar,
}: {
  children: ReactNode;
  acao: string;
  salvar: (dados: FormData) => Promise<void>;
}) {
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  return (
    <form
      onSubmit={async (evento) => {
        evento.preventDefault();
        const dados = new FormData(evento.currentTarget);
        setOcupado(true);
        setErro("");

        try {
          await salvar(dados);
        } catch (falha) {
          setErro(falha instanceof Error ? falha.message : "Falha na operação.",);
        } finally {
          setOcupado(false);
        }
      }}
    >
      <fieldset disabled={ocupado}>
        {children}
        <button>{ocupado ? "Aguarde…" : acao}</button>
      </fieldset>
      {erro && (
        <p className="error" role="alert">
          {erro}
        </p>
      )}
    </form>
  );
}