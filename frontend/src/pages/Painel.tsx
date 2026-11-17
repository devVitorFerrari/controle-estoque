import { TabelaMovimentos } from "../components/TabelaMovimentos";
import {
  enviar,
  type Movimento,
  type Produto,
  type Usuario,
} from "../servicos/api";
import { useConsulta } from "../servicos/useConsulta";

export function Painel() {
  const produtos = useConsulta<Produto[]>("/produtos");
  const movimentos = useConsulta<Movimento[]>("/movimentacoes");
  const ativos = produtos.dados?.filter((produto) => produto.ativo);
  
  return (
    <>
      <h1>Painel</h1>
      <div className="cards">
        <div className="card">
          Produtos ativos<strong>{ativos?.length ?? "—"}</strong>
        </div>
        <div className="card warn">
          Abaixo do mínimo
          <strong>
            {ativos?.filter((produto) => produto.saldo < produto.minimo)
              .length ?? "—"}
          </strong>
        </div>
      </div>
      {(produtos.erro || movimentos.erro) && (
        <p role="alert">{produtos.erro || movimentos.erro}</p>
      )}
      <section>
        <h2>Últimas movimentações</h2>
        {movimentos.dados && (
          <TabelaMovimentos movimentos={movimentos.dados.slice(0, 5)} />
        )}
      </section>
    </>
  );
}
