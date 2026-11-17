import type { ReactNode } from "react";

export function Tabela({
  colunas,
  linhas,
}: {
  colunas: string[];
  linhas: { chave: string | number; celulas: ReactNode[] }[];
}) {
  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna} scope="col">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.length ? (
            linhas.map(({ chave, celulas }) => (
              <tr key={chave}>
                {celulas.map((celula, indice) => (
                  <td key={indice}>{celula}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={colunas.length}>Nenhum registro encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
