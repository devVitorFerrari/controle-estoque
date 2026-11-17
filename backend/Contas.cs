using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public sealed class BancoContas(DbContextOptions<BancoContas> opcoes) : IdentityDbContext<IdentityUser>(opcoes) { }

public sealed record Credenciais(string Usuario, string Senha);
public sealed record Cadastro(string Usuario, string Email, string Senha);
public sealed record Recuperacao(string Email);
public sealed record Redefinicao(string Email, string Codigo, string Senha);

public sealed class EnvioEmail(IConfiguration configuracao)
{
    public async Task EnviarCodigo(string destino, string codigo)
    {
        var host = configuracao["Smtp:Host"] ?? throw new InvalidOperationException("Configure o SMTP.");
        var remetente = configuracao["Smtp:Remetente"] ?? throw new InvalidOperationException("Configure o remetente.");

        using var smtp = new SmtpClient(host, configuracao.GetValue("Smtp:Porta", 587))
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(configuracao["Smtp:Usuario"], configuracao["Smtp:Senha"])
        };

        using var mensagem = new MailMessage(remetente, destino, "Recuperação de senha",
            $"Seu código de recuperação é: {codigo}");

        await smtp.SendMailAsync(mensagem);
    }
}