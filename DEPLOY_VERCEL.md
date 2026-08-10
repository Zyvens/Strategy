# Deploy no Vercel

Este projeto foi preparado para rodar na Vercel com sincronização em nuvem via Vercel Functions + Neon Postgres.

## 1. Importe o GitHub

- Entre em https://vercel.com
- Faça login com GitHub
- Add New → Project
- Importe `Zyvens/Strategy`
- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: deixe vazio
- Output Directory: deixe vazio
- Deploy

## 2. Crie o banco dentro da Vercel

- Abra o projeto
- Storage / Marketplace
- Escolha `Neon`
- Install
- Crie um Postgres no plano desejado
- Conecte o recurso ao projeto `Strategy`

A integração adicionará `DATABASE_URL` automaticamente ao projeto.

## 3. Configure a chave privada

No projeto:

Settings → Environment Variables

Crie:

```
SYNC_KEY=<uma senha longa e aleatória>
```

Marque Production e Preview. Não salve essa chave no GitHub.

## 4. Redeploy

Depois das variáveis, faça um Redeploy do último deployment, ou faça qualquer novo commit na `main`.

Teste:

```
https://SEU-DOMINIO.vercel.app/api/health
```

O retorno esperado é:

```json
{
  "ok": true,
  "cloudConfigured": true,
  "databaseConfigured": true,
  "syncKeyConfigured": true
}
```

## 5. Sincronize PC e celular

No app, abra Configurações → Vercel Cloud Sync e use:

- Perfil: `vitor`
- Chave: o mesmo valor de `SYNC_KEY`
- Ativar sincronização em nuvem

No primeiro dispositivo, envie o estado local. No segundo, use Baixar da nuvem.

## Segurança

- `DATABASE_URL` fica somente no backend da Vercel.
- `SYNC_KEY` fica na Vercel e no armazenamento local dos seus dispositivos.
- A API rejeita requisições sem a chave correta.
- Para um app multiusuário público, substitua este mecanismo por autenticação real (Neon Auth, Clerk, Auth0 etc.).
