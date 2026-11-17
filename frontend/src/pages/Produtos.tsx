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

export function Produtos() {
  const { dados, erro, atualizar } = useConsulta<Produto[]>("/produtos");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [edicao, setEdicao] = useState<Produto | "novo" | null>(null);
  const produto = typeof edicao === "object" ? edicao : null;
  const filtrados = (dados ?? []).filter(
    (item) =>
      (item.nome + " " + item.sku)
        .toLowerCase()
        .includes(busca.trim().toLowerCase()) &&
      (status === "todos" || item.ativo === (status === "ativos")),
  );

  return (
    <>
      <div className="top">
        <h1>Produtos</h1>
        <button onClick={() => setEdicao("novo")}>+ Novo produto</button>
      </div>
      {edicao && (
        <section>
          <h2>{produto ? "Editar produto" : "Novo produto"}</h2>
          <Formulario
            key={produto?.id ?? "novo"}
            acao="Salvar produto"
            salvar={async (campos) => {
              await enviar(
                produto ? `/produtos/${produto.id}` : "/produtos",
                {
                  sku: campos.get("sku"),
                  nome: campos.get("nome"),
                  unidade: campos.get("unidade"),
                  minimo: Number(campos.get("minimo")),
                  ativo: campos.get("ativo") === "on",
                },
                produto ? "PUT" : "POST",
              );

              setEdicao(null);
              atualizar();
            }}
          >
            <label>
              SKU
              <input
                name="sku"
                defaultValue={produto?.sku}
                required
                maxLength={30}
              />
            </label>
            <label>
              Nome
              <input
                name="nome"
                defaultValue={produto?.nome}
                required
                maxLength={100}
              />
            </label>
            <label>
              Unidade
              <input
                name="unidade"
                defaultValue={produto?.unidade ?? "un."}
                required
                maxLength={20}
              />
            </label>
            <label>
              Estoque mínimo
              <input
                name="minimo"
                type="number"
                min="0"
                max="1000000000"
                defaultValue={produto?.minimo ?? 0}
                required
              />
            </label>
            <label>
              <span>
                <input
                  name="ativo"
                  type="checkbox"
                  defaultChecked={produto?.ativo ?? true}
                />{" "}
                Produto ativo
              </span>
            </label>
          </Formulario>
          <button className="sub" onClick={() => setEdicao(null)}>
            Cancelar
          </button>
        </section>
      )}
      <div className="bar">
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          aria-label="Buscar por nome ou SKU"
          placeholder="Buscar por nome ou SKU"
        />
        <select
          value={status}
          onChange={(evento) => setStatus(evento.target.value)}
          aria-label="Status"
        >
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
      </div>
      {erro && <p role="alert">{erro}</p>}
      <section>
        <Tabela
          colunas={["SKU", "Produto", "Saldo", "Mínimo", "Status", "Ações"]}
          linhas={filtrados.map((item) => ({
            chave: item.id,
            celulas: [
              item.sku,
              item.nome,
              `${item.saldo} ${item.unidade}`,
              item.minimo,
              item.ativo
                ? item.saldo < item.minimo
                  ? "Abaixo do mínimo"
                  : "Ativo"
                : "Inativo",
              <button className="sub" onClick={() => setEdicao(item)}>
                Editar
              </button>,
            ],
          }))}
        />
      </section>
    </>
  );
}