import { useState } from "react";
import { TabelaMovimentos } from "../components/TabelaMovimentos";
import {
  enviar,
  type Movimento,
  type Produto,
  type Usuario,
} from "../servicos/api";
import { useConsulta } from "../servicos/useConsulta";

export function Historico() {
  const movimentos = useConsulta<Movimento[]>("/movimentacoes");
  const produtos = useConsulta<Produto[]>("/produtos");
  const [produto, setProduto] = useState("");
  const [tipo, setTipo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const filtrados = (movimentos.dados ?? []).filter((item) => {
    const data = new Date(item.data).toLocaleDateString("sv-SE");
    return (
      (!produto || item.produtoId === Number(produto)) &&
      (!tipo || item.tipo === tipo) &&
      (!inicio || data >= inicio) &&
      (!fim || data <= fim)
    );
  });
  
  return (
    <>
      <h1>Histórico</h1>
      <div className="bar">
        <label>
          Produto
          <select
            value={produto}
            onChange={(evento) => setProduto(evento.target.value)}
          >
            <option value="">Todos</option>
            {produtos.dados?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
          >
            <option value="">Todos</option>
            <option>Entrada</option>
            <option value="Saida">Saída</option>
          </select>
        </label>
        <label>
          De
          <input
            type="date"
            value={inicio}
            onChange={(evento) => setInicio(evento.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={fim}
            onChange={(evento) => setFim(evento.target.value)}
          />
        </label>
      </div>
      {(movimentos.erro || produtos.erro) && (
        <p role="alert">{movimentos.erro || produtos.erro}</p>
      )}
      <section>
        <TabelaMovimentos movimentos={filtrados} />
      </section>
    </>
  );
}
