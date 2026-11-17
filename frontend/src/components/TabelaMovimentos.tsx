import type { Movimento } from "../servicos/api";
import { Tabela } from "./Tabela";

export function TabelaMovimentos({ movimentos }: { movimentos: Movimento[] }) {
  return (
    <Tabela
      colunas={[
        "Data",
        "Produto",
        "Tipo",
        "Quantidade",
        "Saldo anterior",
        "Saldo final",
        "Observação",
      ]}
      linhas={movimentos.map((movimento) => ({
        chave: movimento.id,
        celulas: [
          new Date(movimento.data).toLocaleString("pt-BR"),
          movimento.produto,
          movimento.tipo === "Saida" ? "Saída" : "Entrada",
          movimento.quantidade,
          movimento.anterior,
          movimento.posterior,
          movimento.observacao || "—",
        ],
      }))}
    />
  );
}
