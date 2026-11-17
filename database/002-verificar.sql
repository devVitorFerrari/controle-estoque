WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET SQLBLANKLINES ON

DECLARE
  v_id produto.id%TYPE;
  v_saldo produto.saldo%TYPE;
  v_antes NUMBER;
  v_depois NUMBER;
BEGIN
  INSERT INTO produto(sku, nome, unidade, minimo)
  VALUES ('TESTE-TRANSACAO', 'Produto de teste', 'un.', 5)
    RETURNING id INTO v_id;

  registrar_movimentacao(v_id, 'Entrada', 12, NULL);
  registrar_movimentacao(v_id, 'Saida', 8, NULL);

  SELECT saldo 
    INTO v_saldo 
    FROM produto 
  WHERE id = v_id;

  IF v_saldo <> 4 THEN
    RAISE_APPLICATION_ERROR(-20900, 'Saldo esperado: 4');
  END IF;

  SELECT COUNT(*) INTO v_antes FROM movimentacao WHERE produto_id = v_id;
  BEGIN
    registrar_movimentacao(v_id, 'Saida', 5, NULL);
    RAISE_APPLICATION_ERROR(-20901, 'A saída deveria ter sido rejeitada');
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLCODE <> -20003 THEN RAISE; END IF;
  END;

  SELECT COUNT(*) INTO v_depois FROM movimentacao WHERE produto_id = v_id;
  SELECT saldo INTO v_saldo FROM produto WHERE id = v_id;

  IF v_antes <> 2 OR v_depois <> v_antes OR v_saldo <> 4 THEN
    RAISE_APPLICATION_ERROR(-20902, 'Uma falha alterou saldo ou histórico');
  END IF;

  -- Remove o produto e as movimentações usados neste teste.
  ROLLBACK;
END;
/