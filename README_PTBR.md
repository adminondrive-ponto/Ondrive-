## atualizar readme ##

# OnDrive SaaS Professional

Base profissional do OnDrive para continuar no **Git + Vercel + Supabase**.

## O que esta base já entrega
- Login com Supabase Auth
- Middleware para sessão no App Router do Next.js
- Dashboard executivo
- CRUD para:
  - veículos
  - motoristas
  - tipos de contrato
  - contratos
  - multas
  - vistorias
  - sócios
  - financeiro
- Copiloto IA do OnDrive via **Supabase Edge Function**
- Estrutura pronta para continuar evoluindo sem depender de um único `index.html`

## Estrutura
- `app/` -> páginas do Next.js
- `components/` -> shell, login, CRUD genérico, copiloto
- `lib/` -> configs dos módulos e clientes Supabase
- `supabase/functions/copilot-chat/` -> Edge Function da IA
- `supabase/migrations/` -> hardening do banco

## Variáveis de ambiente
Crie `.env.local` a partir de `.env.example`.

Obrigatórias no Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SUPPORT_PHONE`

## Como rodar localmente
```bash
npm install
npm run dev
```

## Como subir no Git
```bash
git init
git add .
git commit -m "feat: ondrive saas professional"
git branch -M main
git remote add origin SEU_REPOSITORIO_GIT
git push -u origin main
```

## Como publicar no Vercel
1. Crie um novo projeto no Vercel conectado ao seu repositório.
2. Framework preset: **Next.js**.
3. Configure as variáveis de ambiente.
4. Faça o deploy.

## Como publicar a Edge Function no Supabase
Instale o CLI do Supabase e faça login.

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy copilot-chat
supabase secrets set ANTHROPIC_API_KEY=SUA_CHAVE
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
```

## Como aplicar a migration de segurança
Você pode rodar o SQL em `supabase/migrations/20260422_ondrive_security.sql` no SQL Editor do Supabase.

## Pontos importantes
- O CRUD desta base usa o **Supabase direto no front**, protegido por **RLS**.
- A IA fica protegida no **backend do Supabase**, não no navegador.
- O projeto foi organizado para você continuar migrando suas regras sem recomeçar do zero.

## Próximo nível recomendado
- substituir os campos `ID motorista`, `ID veículo` e `ID tipo contrato` por selects relacionais
- adicionar upload de documentos e fotos no Supabase Storage
- criar importação Excel no backend
- criar relatórios em PDF/Excel
- adicionar multiempresa se você quiser vender como SaaS para vários clientes
