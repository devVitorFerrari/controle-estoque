using System.Data.Common;
using Oracle.ManagedDataAccess.Client;

public sealed record Produto(long Id, string Sku, string Nome, string Unidade, long Minimo, long Saldo, bool Ativo);
public sealed record DadosProduto(string Sku, string Nome, string Unidade, long Minimo, bool Ativo);
public sealed record DadosMovimentacao(long ProdutoId, string Tipo, long Quantidade, string? Observacao);
public sealed record Movimento(long Id, long ProdutoId, string Produto, string Tipo, long Quantidade, long Anterior, long Posterior, string? Observacao, DateTime Data);

public sealed class EstoqueOracle(string conexao)
{
    public Task<List<Produto>> ListarProdutos(CancellationToken cancelamento) =>
        Consultar("""
            SELECT id, sku, nome, unidade, minimo, saldo, ativo FROM produto ORDER BY nome
            """, linha => new Produto(linha.GetInt64(0), linha.GetString(1),
                linha.GetString(2), linha.GetString(3), linha.GetInt64(4),
                linha.GetInt64(5), linha.GetInt32(6) == 1), cancelamento);

    public Task<List<Movimento>> ListarMovimentos(CancellationToken cancelamento) =>
        Consultar("""
            SELECT m.id, m.produto_id, p.nome, m.tipo, m.quantidade, m.anterior,
                   m.posterior, m.observacao, m.data_registro
            FROM movimentacao m JOIN produto p ON p.id = m.produto_id
            ORDER BY m.data_registro DESC, m.id DESC
            """, linha => new Movimento(linha.GetInt64(0), linha.GetInt64(1), linha.GetString(2),
                linha.GetString(3), linha.GetInt64(4), linha.GetInt64(5), linha.GetInt64(6),
                linha.IsDBNull(7) ? null : linha.GetString(7),
                DateTime.SpecifyKind(linha.GetDateTime(8), DateTimeKind.Utc)), cancelamento);

    public Task<int> SalvarProduto(long? id, DadosProduto dados, CancellationToken cancelamento)
    {
        var sql = id.HasValue
            ? "UPDATE produto SET sku=:sku, nome=:nome, unidade=:unidade, minimo=:minimo, ativo=:ativo WHERE id=:id"
            : "INSERT INTO produto(sku, nome, unidade, minimo, ativo) VALUES (:sku, :nome, :unidade, :minimo, :ativo)";
        return Executar(sql, comando =>
        {
            comando.Parameters.Add("sku", OracleDbType.Varchar2).Value = dados.Sku.Trim().ToUpperInvariant();
            comando.Parameters.Add("nome", OracleDbType.Varchar2).Value = dados.Nome.Trim();
            comando.Parameters.Add("unidade", OracleDbType.Varchar2).Value = dados.Unidade.Trim();
            comando.Parameters.Add("minimo", OracleDbType.Int64).Value = dados.Minimo;
            comando.Parameters.Add("ativo", OracleDbType.Int32).Value = dados.Ativo ? 1 : 0;

            if (id.HasValue) 
                comando.Parameters.Add("id", OracleDbType.Int64).Value = id.Value;
        }, cancelamento);
    }

    public Task<int> RegistrarMovimentacao(DadosMovimentacao dados, CancellationToken cancelamento) =>
        Executar("BEGIN registrar_movimentacao(:produto, :tipo, :quantidade, :observacao); END;",
            comando =>
            {
                comando.Parameters.Add("produto", OracleDbType.Int64).Value = dados.ProdutoId;
                comando.Parameters.Add("tipo", OracleDbType.Varchar2).Value = dados.Tipo;
                comando.Parameters.Add("quantidade", OracleDbType.Int64).Value = dados.Quantidade;
                comando.Parameters.Add("observacao", OracleDbType.Varchar2).Value = (object?)dados.Observacao?.Trim() ?? DBNull.Value;
            }, cancelamento);

    private async Task<List<T>> Consultar<T>(string sql, Func<DbDataReader, T> mapear, CancellationToken cancelamento)
    {
        await using var banco = new OracleConnection(conexao);
        await banco.OpenAsync(cancelamento);
        await using var comando = new OracleCommand(sql, banco);
        await using var leitor = await comando.ExecuteReaderAsync(cancelamento);

        var registros = new List<T>();
        while (await leitor.ReadAsync(cancelamento)) 
            registros.Add(mapear(leitor));

        return registros;
    }

    private async Task<int> Executar(string sql, Action<OracleCommand> configurar, CancellationToken cancelamento)
    {
        await using var banco = new OracleConnection(conexao);
        await banco.OpenAsync(cancelamento);

        // Os comandos desta conexão participam da transação iniciada aqui.
        using var transacao = banco.BeginTransaction();
        await using var comando = new OracleCommand(sql, banco) { BindByName = true };
        configurar(comando);

        var alteracoes = await comando.ExecuteNonQueryAsync(cancelamento);

        transacao.Commit();

        return alteracoes;
    }
}
