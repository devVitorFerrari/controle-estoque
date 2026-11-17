WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
SET SQLBLANKLINES ON

CREATE TABLE produto (
  id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku     VARCHAR2(30 CHAR) NOT NULL UNIQUE,
  nome    VARCHAR2(100 CHAR) NOT NULL,
  unidade VARCHAR2(20 CHAR) NOT NULL,
  minimo  NUMBER(12) DEFAULT 0 NOT NULL CHECK (minimo >= 0),
  saldo   NUMBER(12) DEFAULT 0 NOT NULL CHECK (saldo >= 0),
  ativo   NUMBER(1) DEFAULT 1 NOT NULL CHECK (ativo IN (0, 1))
);

CREATE TABLE movimentacao (
  id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  produto_id    NUMBER NOT NULL REFERENCES produto(id),
  tipo          VARCHAR2(7) NOT NULL CHECK (tipo IN ('Entrada', 'Saida')),
  quantidade    NUMBER(12) NOT NULL CHECK (quantidade > 0),
  anterior      NUMBER(12) NOT NULL,
  posterior     NUMBER(12) NOT NULL,
  observacao    VARCHAR2(240 CHAR),
  data_registro TIMESTAMP DEFAULT SYS_EXTRACT_UTC(SYSTIMESTAMP) NOT NULL
);

CREATE OR REPLACE PROCEDURE registrar_movimentacao(
  p_produto    IN NUMBER, 
  p_tipo       IN VARCHAR2, 
  p_quantidade IN NUMBER,
  p_observacao IN VARCHAR2
) AS
  v_saldo produto.saldo%TYPE;
  v_ativo produto.ativo%TYPE;
  v_novo_saldo produto.saldo%TYPE;
BEGIN
  IF p_tipo IS NULL OR p_tipo NOT IN ('Entrada', 'Saida')
     OR p_quantidade IS NULL OR p_quantidade <= 0
     OR p_quantidade <> TRUNC(p_quantidade) THEN
    RAISE_APPLICATION_ERROR(-20001, 'Movimentação inválida');
  END IF;

  -- Serializa operações concorrentes sobre o mesmo produto.
  SELECT saldo, 
         ativo 
    INTO v_saldo, v_ativo
    FROM produto 
   WHERE id = p_produto FOR UPDATE;
  
  IF v_ativo = 0 THEN 
    RAISE_APPLICATION_ERROR(-20002, 'Produto inativo');
  END IF;

  IF p_tipo = 'Saida' THEN
    IF v_saldo < p_quantidade THEN
      RAISE_APPLICATION_ERROR(-20003, 'Saldo insuficiente');
    END IF;

    v_novo_saldo := v_saldo - p_quantidade;
  ELSE
    v_novo_saldo := v_saldo + p_quantidade;
  END IF;

  UPDATE produto SET 
         saldo = v_novo_saldo 
   WHERE id = p_produto;

  INSERT INTO movimentacao(produto_id, tipo, quantidade, anterior, posterior, observacao)
  VALUES (p_produto, p_tipo, p_quantidade, v_saldo, v_novo_saldo, p_observacao);

  -- A aplicação confirma saldo e histórico na mesma transação.
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20004, 'Produto não encontrado');
END;

/
INSERT INTO produto(sku, nome, unidade, minimo) VALUES ('CX001', 'Caixa organizadora', 'un.', 5);
INSERT INTO produto(sku, nome, unidade, minimo) VALUES ('PAP001', 'Papel A4', 'pct.', 10);
INSERT INTO produto(sku, nome, unidade, minimo) VALUES ('CAB001', 'Cabo USB-C', 'un.', 5);

-- Registra o saldo inicial pelo mesmo fluxo usado nas entradas normais.
BEGIN
  FOR item IN (SELECT id, sku FROM produto) LOOP
    registrar_movimentacao(item.id, 'Entrada', CASE item.sku WHEN 'PAP001' THEN 2 ELSE 12 END, 'Saldo inicial');
  END LOOP;
END;
/

COMMIT;