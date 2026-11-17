import { NavLink } from "react-router-dom";

const paginas = [
  ["/", "Painel"],
  ["/produtos", "Produtos"],
  ["/movimentacao", "Nova movimentação"],
  ["/historico", "Histórico"],
  ["/usuarios", "Usuários"],
];

export function MenuLateral({ sair }: { sair: () => void }) {
  return (
    <aside>
      <strong>Controle de Estoque</strong>
      <nav aria-label="Navegação">
        {paginas.map(([endereco, titulo]) => (
          <NavLink key={endereco} to={endereco} end>
            {titulo}
          </NavLink>
        ))}
      </nav>
      <button className="sub" onClick={sair}>
        Sair
      </button>
    </aside>
  );
}
