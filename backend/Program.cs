using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Oracle.ManagedDataAccess.Client;

var construtor = WebApplication.CreateBuilder(args);
var configuracao = construtor.Configuration;
var conexao = configuracao.GetConnectionString("Oracle") ?? throw new InvalidOperationException("Defina ConnectionStrings__Oracle.");

construtor.Services.AddSingleton(new EstoqueOracle(conexao));
construtor.Services.AddSingleton<EnvioEmail>();
construtor.Services.AddDbContext<BancoContas>(opcoes => opcoes.UseSqlite(configuracao.GetConnectionString("Contas") ?? "Data Source=contas.db"));

construtor.Services.AddIdentity<IdentityUser, IdentityRole>(opcoes =>
{
    opcoes.User.RequireUniqueEmail = true;
    opcoes.Lockout.MaxFailedAccessAttempts = 5;
}).AddEntityFrameworkStores<BancoContas>().AddDefaultTokenProviders();

construtor.Services.Configure<DataProtectionTokenProviderOptions>(opcoes => opcoes.TokenLifespan = TimeSpan.FromMinutes(15));

construtor.Services.ConfigureApplicationCookie(opcoes =>
{
    opcoes.Events.OnRedirectToLogin = contexto =>
    {
        contexto.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    opcoes.Events.OnRedirectToAccessDenied = contexto =>
    {
        contexto.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

construtor.Services.AddAntiforgery(opcoes => opcoes.HeaderName = "X-CSRF-TOKEN");

construtor.Services.AddRateLimiter(opcoes =>
{
    opcoes.RejectionStatusCode = 429;
    opcoes.AddFixedWindowLimiter("contas", limite =>
    {
        limite.PermitLimit = 12;
        limite.Window = TimeSpan.FromMinutes(1);
    });
});

construtor.Services.AddEndpointsApiExplorer();
construtor.Services.AddSwaggerGen();

var app = construtor.Build();
using (var escopo = app.Services.CreateScope())
{
    await escopo.ServiceProvider.GetRequiredService<BancoContas>().Database.EnsureCreatedAsync();
    var usuarios = escopo.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    var nome = configuracao["ContaInicial:Usuario"];

    if (!string.IsNullOrWhiteSpace(nome) && await usuarios.FindByNameAsync(nome) is null)
    {
        var email = configuracao["ContaInicial:Email"] ?? throw new InvalidOperationException("Defina ContaInicial__Email.");
        var senha = configuracao["ContaInicial:Senha"] ?? throw new InvalidOperationException("Defina ContaInicial__Senha.");
        var resultado = await usuarios.CreateAsync(new IdentityUser(nome) { Email = email }, senha);

        if (!resultado.Succeeded) 
            throw new InvalidOperationException(string.Join("; ", resultado.Errors.Select(erro => erro.Description)));
    }
}

if (app.Environment.IsDevelopment()) app.UseSwagger();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");
api.AddEndpointFilter(async (contexto, proximo) =>
{
    var http = contexto.HttpContext;
    if (!HttpMethods.IsGet(http.Request.Method) && !await http.RequestServices.GetRequiredService<IAntiforgery>().IsRequestValidAsync(http))
        return Results.BadRequest(new { mensagem = "Sessão de formulário inválida. Atualize a página." });

    try { 
        return await proximo(contexto); 
    }
    catch (OracleException erro) when (erro.Number == 1 || erro.Number is >= 20001 and <= 20004)
    {
        var mensagem = erro.Number switch
        {
            1 => "SKU já cadastrado.",
            20002 => "Produto inativo.",
            20003 => "Saldo insuficiente.",
            20004 => "Produto não encontrado.",
            _ => "Movimentação inválida."
        };
        return Results.Conflict(new { mensagem });
    }
});

api.MapGet("/csrf", (HttpContext contexto, IAntiforgery antifalsificacao) =>
    new { token = antifalsificacao.GetAndStoreTokens(contexto).RequestToken });

api.MapGet("/sessao", (HttpContext contexto) =>
    new { autenticado = contexto.User.Identity?.IsAuthenticated == true, usuario = contexto.User.Identity?.Name });

api.MapPost("/login", async (Credenciais dados, SignInManager<IdentityUser> acesso) =>
{
    var resultado = await acesso.PasswordSignInAsync(dados.Usuario, dados.Senha, false, true);
    return resultado.Succeeded ? Results.NoContent() : Results.Json(new { mensagem = "Credenciais inválidas ou acesso temporariamente bloqueado." }, statusCode: 401);
}).RequireRateLimiting("contas");

api.MapPost("/recuperacao", async (Recuperacao dados, UserManager<IdentityUser> usuarios, EnvioEmail email) =>
{
    var usuario = await usuarios.FindByEmailAsync(dados.Email);
    if (usuario is not null)
    {
        var token = await usuarios.GeneratePasswordResetTokenAsync(usuario);
        await email.EnviarCodigo(dados.Email, token);
    }

    return Results.NoContent();
}).RequireRateLimiting("contas");

api.MapPost("/redefinicao", async (Redefinicao dados, UserManager<IdentityUser> usuarios) =>
{
    var usuario = await usuarios.FindByEmailAsync(dados.Email);

    if (usuario is null) 
        return Results.BadRequest(new { mensagem = "Não foi possível redefinir a senha." });

    return ResultadoIdentity(await usuarios.ResetPasswordAsync(usuario, dados.Codigo, dados.Senha));
}).RequireRateLimiting("contas");

// As rotas deste grupo exigem uma sessão autenticada.
var interno = api.MapGroup("").RequireAuthorization();
interno.MapPost("/sair", async (SignInManager<IdentityUser> acesso) =>
{
    await acesso.SignOutAsync();
    return Results.NoContent();
});

interno.MapGet("/usuarios", (BancoContas banco, CancellationToken cancelamento) =>
    banco.Users.OrderBy(usuario => usuario.UserName)
        .Select(usuario => new { usuario = usuario.UserName, email = usuario.Email }).ToListAsync(cancelamento));

interno.MapPost("/usuarios", async (Cadastro dados, UserManager<IdentityUser> usuarios) =>
    ResultadoIdentity(await usuarios.CreateAsync(new IdentityUser(dados.Usuario) { Email = dados.Email }, dados.Senha)));

interno.MapGet("/produtos", (EstoqueOracle estoque, CancellationToken cancelamento) => estoque.ListarProdutos(cancelamento));
interno.MapGet("/movimentacoes", (EstoqueOracle estoque, CancellationToken cancelamento) => estoque.ListarMovimentos(cancelamento));

interno.MapPost("/produtos", (DadosProduto dados, EstoqueOracle estoque, CancellationToken cancelamento) =>
    SalvarProduto(null, dados, estoque, cancelamento));

interno.MapPut("/produtos/{id:long}", (long id, DadosProduto dados, EstoqueOracle estoque, CancellationToken cancelamento) =>
    SalvarProduto(id, dados, estoque, cancelamento));

interno.MapPost("/movimentacoes", async (DadosMovimentacao dados, EstoqueOracle estoque, CancellationToken cancelamento) =>
{
    if (dados.Quantidade is < 1 or > 1_000_000_000 || dados.Observacao?.Length > 240)
        return Results.BadRequest(new { mensagem = "Quantidade ou observação inválida." });
        
    await estoque.RegistrarMovimentacao(dados, cancelamento);
    return Results.NoContent();
});

app.MapFallback("/api/{**rota}", () => Results.NotFound());
app.MapFallbackToFile("index.html");
app.Run();

static IResult ResultadoIdentity(IdentityResult resultado) =>
    resultado.Succeeded ? Results.NoContent() :
        Results.BadRequest(new { mensagem = string.Join(" ", resultado.Errors.Select(erro => erro.Description)) });

static async Task<IResult> SalvarProduto(long? id, DadosProduto dados, EstoqueOracle estoque, CancellationToken cancelamento)
{
    if (string.IsNullOrWhiteSpace(dados.Sku) || dados.Sku.Trim().Length > 30 ||
        string.IsNullOrWhiteSpace(dados.Nome) || dados.Nome.Trim().Length > 100 ||
        string.IsNullOrWhiteSpace(dados.Unidade) || dados.Unidade.Trim().Length > 20 ||
        dados.Minimo is < 0 or > 1_000_000_000)
        return Results.BadRequest(new { mensagem = "Confira SKU, nome, unidade e estoque mínimo." });

    return await estoque.SalvarProduto(id, dados, cancelamento) == 0 ? Results.NotFound() : Results.NoContent();
}