import { useState } from "react";
import { Formulario } from "../components/Formulario";
import {
  enviar,
  type Movimento,
  type Produto,
  type Usuario,
} from "../servicos/api";
import { useConsulta } from "../servicos/useConsulta";

export function NovaMovimentacao() {
  const { dados, erro, atualizar } = useConsulta<Produto[]>("/produtos");
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState("Entrada");
  const [quantidade, setQuantidade] = useState("");
  const [mensagem, setMensagem] = useState("");
  const produto = dados?.find((item) => item.id === Number(produtoId));
  const saldoProjetado = produto
    ? produto.saldo + Number(quantidade) * (tipo === "Saida" ? -1 : 1)
    : null;
    
  return (
    <>
      <h1>Nova movimentação</h1>
      <section>
        {erro && <p role="alert">{erro}</p>}
        {mensagem && <p role="status">{mensagem}</p>}
        <Formulario
          acao="Registrar movimentação"
          salvar={async (campos) => {
            setMensagem("");

            await enviar("/movimentacoes", {
              produtoId: Number(produtoId),
              tipo,
              quantidade: Number(quantidade),
              observacao: campos.get("observacao"),
            });

            setMensagem("Movimentação registrada.");
            setQuantidade("");
            atualizar();
          }}
        >
          <label>
            Produto
            <select
              value={produtoId}
              onChange={(evento) => setProdutoId(evento.target.value)}
              required
            >
              <option value="">Selecione</option>
              {dados
                ?.filter((item) => item.ativo)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
            </select>
          </label>
          {produto && (
            <p>
              Saldo atual: {produto.saldo} {produto.unidade}
            </p>
          )}
          <label>
            Tipo
            <select
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value)}
            >
              <option>Entrada</option>
              <option value="Saida">Saída</option>
            </select>
          </label>
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              max="1000000000"
              required
              value={quantidade}
              onChange={(evento) => setQuantidade(evento.target.value)}
            />
          </label>
          <label>
            Observação
            <textarea name="observacao" maxLength={240} />
          </label>
          {quantidade && saldoProjetado !== null && (
            <p aria-live="polite">
              {saldoProjetado < 0
                ? "Saldo insuficiente para esta saída."
                : `Saldo após a movimentação: ${saldoProjetado}`}
            </p>
          )}
        </Formulario>
      </section>
    </>
  );
}