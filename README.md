# Controle de Estoque

Fiz este projeto para praticar a integração de uma interface React com uma API em .NET e um banco Oracle. Dá para cadastrar produtos, registrar entradas e saídas e consultar o histórico. O painel mostra quais produtos estão abaixo do estoque mínimo.

O front-end usa React e TypeScript. A API é em ASP.NET Core (.NET 8). Os produtos e as movimentações ficam no Oracle, e as contas de usuário ficam no SQLite com ASP.NET Core Identity.

## Como rodar no Windows

Você vai precisar do Docker Desktop, do SDK do .NET 8 e do Node.js 22. Abra a pasta do projeto no VS Code e use o PowerShell.

### 1. Subir o Oracle

Copie `.env.example` para `.env`, preencha as duas senhas e rode:

```powershell
docker compose up -d
docker compose logs -f oracle
```

Quando o Oracle estiver pronto, saia dos logs com Ctrl+C. Para criar as tabelas em um banco novo, rode:

```powershell
docker compose cp database/001-estoque.sql oracle:/tmp/001-estoque.sql
docker compose exec oracle sqlplus estoque@//localhost:1521/FREEPDB1
```

Digite a senha de `ESTOQUE_DB_PASSWORD`. No SQL*Plus, execute `@/tmp/001-estoque.sql` e saia com `EXIT`.

### 2. Iniciar a API

Na raiz do projeto, ajuste a senha do Oracle e escolha uma senha para sua conta local:

```powershell
$env:ConnectionStrings__Oracle = 'User Id=estoque;Password=SUA_SENHA_ORACLE;Data Source=localhost:1521/FREEPDB1'
$env:ContaInicial__Usuario = 'vitor'
$env:ContaInicial__Email = 'vitor@example.com'
$env:ContaInicial__Senha = 'SUA_SENHA_FORTE'
dotnet run --project backend -- --urls http://localhost:5080
```

Use uma senha com maiúscula, minúscula, número e caractere especial.

### 3. Iniciar o front-end

Em outro terminal, a partir da raiz:

```powershell
cd frontend
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite e entre com a conta local. A recuperação de senha por e-mail exige configuração SMTP na API.

## Um teste rápido

Em um banco novo, a **Caixa organizadora** começa com 12 unidades. Registre uma saída de 8 e confira se o saldo ficou em 4 e se a saída apareceu no histórico. Depois, tente retirar mais 5. A saída deve ser recusada, com o saldo e o histórico preservados.

## Por onde começar no código

- [NovaMovimentacao.tsx](frontend/src/pages/NovaMovimentacao.tsx) é a tela que envia a entrada ou a saída para a API.
- [Program.cs](backend/Program.cs) recebe a requisição e chama [EstoqueOracle.cs](backend/EstoqueOracle.cs).
- [001-estoque.sql](database/001-estoque.sql) tem a procedure que valida o saldo, atualiza o produto e grava a movimentação na mesma transação.
