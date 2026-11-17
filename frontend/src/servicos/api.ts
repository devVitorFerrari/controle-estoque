export interface Produto {
  id: number;
  sku: string;
  nome: string;
  unidade: string;
  minimo: number;
  saldo: number;
  ativo: boolean;
}

export interface Movimento {
  id: number;
  produtoId: number;
  produto: string;
  tipo: "Entrada" | "Saida";
  quantidade: number;
  anterior: number;
  posterior: number;
  observacao: string | null;
  data: string;
}

export interface Usuario {
  usuario: string;
  email: string;
}

export async function consultar<T>(
  rota: string,
  sinal?: AbortSignal,
): Promise<T> {
  return requisitar<T>(rota, { signal: sinal });
}

export async function enviar(
  rota: string,
  dados?: object,
  metodo = "POST",
): Promise<void> {
  // O token é obtido com a identidade atual, inclusive após login ou logout.
  const { token } = await consultar<{ token: string }>("/csrf");
  
  await requisitar(rota, {
    method: metodo,
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": token },
    body: dados === undefined ? undefined : JSON.stringify(dados),
  });
}

async function requisitar<T>(rota: string, opcoes: RequestInit): Promise<T> {
  const resposta = await fetch("/api" + rota, opcoes);

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.mensagem ?? `Falha na operação (HTTP ${resposta.status}).`,);
  }

  if (resposta.status === 204) 
    return undefined as T;
  
  return resposta.json() as Promise<T>;
}
