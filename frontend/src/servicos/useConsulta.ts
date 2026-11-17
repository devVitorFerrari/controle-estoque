import { useEffect, useState } from "react";
import { consultar } from "./api";

export function useConsulta<T>(rota: string) {
  const [dados, setDados] = useState<T>();
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const controle = new AbortController();
    consultar<T>(rota, controle.signal)
      .then((resultado) => {
        setDados(resultado);
        setErro("");
      })
      .catch((falha: Error) => {
        if (!controle.signal.aborted) 
          setErro(falha.message);
      });
    return () => controle.abort();
  }, [rota, revisao]);

  return {
    dados,
    erro,
    atualizar: () => setRevisao((anterior) => anterior + 1),
  };
}
