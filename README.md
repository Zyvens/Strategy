# Operação Transpetro — Strategy

PWA gamificado para preparação do PSP 004/2026 da Transpetro.

## Versão 4.0 — GitHub Pages + Neon Postgres

A hospedagem continua no **GitHub Pages**. O Neon entra apenas como camada de dados e autenticação, permitindo que PC e celular compartilhem o mesmo progresso sem depender de Vercel.

### Arquitetura

```text
GitHub → GitHub Pages → PWA
                       ├─ localStorage / Service Worker (offline)
                       └─ Neon Auth → Neon Data API → Neon Postgres
```

- GitHub Pages hospeda HTML, CSS, JavaScript e PWA;
- Neon Auth identifica o usuário por e-mail e senha;
- Neon Data API conecta o navegador diretamente ao Postgres por HTTPS;
- Row-Level Security (RLS) limita cada usuário ao próprio estado;
- `localStorage` continua sendo o cache offline;
- ao voltar a internet, o app reconcilia o estado local com o Neon;
- se PC e celular forem alterados ao mesmo tempo, o app não sobrescreve silenciosamente: ele pede qual versão deve prevalecer.

Nenhuma senha administrativa de Postgres ou connection string é armazenada no GitHub.

## Primeira sincronização

1. Abra o app publicado no GitHub Pages.
2. Entre em **Configurações → Neon Postgres**.
3. Clique em **Criar conta** e informe e-mail e senha com pelo menos 8 caracteres.
4. O primeiro dispositivo com progresso local envia esse progresso ao Neon se a nuvem estiver vazia.
5. No celular, abra o mesmo GitHub Pages e faça login com a mesma conta.
6. Se o celular estiver sem progresso relevante, ele baixa automaticamente o estado do Neon.
7. Em caso de duas versões diferentes, escolha explicitamente **Usar versão do Neon** ou **Usar este dispositivo**.

## Segurança

O banco usa Neon Auth + Data API + RLS. A tabela de sincronização possui políticas de leitura, criação, edição e exclusão restritas ao usuário autenticado por `auth.user_id()`.

O frontend contém apenas URLs públicas do Auth/Data API. Credenciais administrativas do banco não são expostas.

## Offline-first

O aplicativo continua utilizável sem internet:

- telas e assets ficam no cache do Service Worker;
- o progresso continua sendo gravado no `localStorage`;
- quando a conexão volta, o sincronizador tenta enviar as alterações;
- polling em segundo plano e sincronização ao focar/ficar online mantêm PC e celular alinhados.

## Missões e micromissões

- missões **diárias**, **semanais** e **mensais**;
- cada missão é dividida em **até 5 micromissões**;
- XP concedido por micromissão concluída;
- dias úteis priorizam conteúdo específico, questões, básicos e caderno de erros;
- sábado funciona como dia de **Boss técnico**;
- domingo concentra revisão e planejamento;
- metas mensais específicas para agosto, setembro, outubro e novembro de 2026.

## Cronograma

- visual híbrido de **Gantt + calendário**;
- fases: Tutorial, Reconhecimento, Leveling, Raids, Endgame, Buff Final e Final Boss;
- targets: **30/50 → 35/50 → 39/50 → 42+/50**;
- calendário mensal navegável;
- ao informar a data oficial da prova, o app calcula automaticamente **D-21**, **D-7** e o Final Boss.

## Caderno de erros

Cada erro possui quatro campos:

1. questão / referência;
2. minha resposta / raciocínio;
3. gabarito / solução correta;
4. causa do erro + regra anti-erro.

O botão **+** cria novos blocos e o conteúdo é salvo automaticamente.

## Central de recursos e simulador

A página Recursos reúne:

- páginas oficiais da Transpetro;
- prova anterior de Engenharia Mecânica;
- prova/gabarito;
- bancos de questões;
- cursos e planos de estudo.

O simulador interno usa somente questões **AUTORAIS**, sempre rotuladas como autorais e modeladas no formato objetivo da CESGRANRIO. Questões históricas reais são acessadas nas fontes externas e não são apresentadas como conteúdo autoral.

## Compatibilidade

A aplicação mantém a chave local `transpetro_strategy_v1`, portanto o progresso das versões anteriores permanece no navegador. A primeira sincronização foi projetada para preservar esse estado em vez de substituí-lo automaticamente.

## Executar localmente

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`. O Neon Auth está configurado para permitir desenvolvimento local e o GitHub Pages como origem de produção.

## Publicação

A produção continua sendo a branch `main` via GitHub Pages. Não há build server-side nem dependência de Vercel.

Veja também `NEON_CLOUD.md` para detalhes da sincronização e operação.
