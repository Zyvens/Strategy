# Operação Transpetro — Strategy

PWA gamificado para preparação do PSP 004/2026 da Transpetro.

## Versão 3.0 — Vercel + sincronização em nuvem

A versão 3 adiciona suporte a hospedagem na Vercel e sincronização do estado entre dispositivos usando Vercel Functions + Postgres provisionado pelo Marketplace (recomendação: Neon).

### Arquitetura

- frontend estático hospedado na Vercel;
- Vercel Functions em `/api` para leitura e gravação do estado;
- Postgres via Marketplace da Vercel (Neon recomendado);
- `localStorage` continua como cache/fallback offline;
- sincronização protegida por uma chave privada definida em `SYNC_KEY` nas Environment Variables da Vercel;
- banco identificado por um `profile_id`, permitindo manter um único perfil compartilhado entre PC e celular.

### Variáveis de ambiente

Configure no projeto da Vercel:

```text
DATABASE_URL=<adicionada automaticamente pela integração Neon>
SYNC_KEY=<uma senha longa criada por você>
```

Nunca coloque `DATABASE_URL` ou `SYNC_KEY` no GitHub.

### Banco

A API cria automaticamente a tabela abaixo no primeiro acesso:

```sql
CREATE TABLE IF NOT EXISTS app_state (
  profile_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### API

- `GET /api/state?profile=vitor` — carrega o estado salvo;
- `PUT /api/state?profile=vitor` — grava o estado completo;
- header obrigatório: `x-sync-key` com o mesmo valor de `SYNC_KEY`.

### Como publicar na Vercel

1. Crie/acesse sua conta em Vercel e conecte o GitHub.
2. Clique em **Add New → Project** e importe `Zyvens/Strategy`.
3. Framework Preset: **Other**.
4. Root Directory: raiz do repositório.
5. Não é necessário Build Command para este projeto estático.
6. Clique em **Deploy**.
7. No projeto, abra **Marketplace / Storage** e instale **Neon**.
8. Crie um banco Postgres e conecte-o ao projeto; a integração injeta `DATABASE_URL` automaticamente.
9. Em **Settings → Environment Variables**, crie `SYNC_KEY` com uma senha longa e aleatória.
10. Faça um novo deploy para que as variáveis sejam aplicadas.
11. No app, use a mesma chave de sincronização no PC e no celular.

A branch `main` é a produção. Depois de conectado ao GitHub, cada push novo para `main` gera um novo deployment automaticamente.

## Versão 2.0

A campanha transforma os objetivos maiores em execução recorrente e mensurável.

### Missões e micromissões

- missões **diárias**, **semanais** e **mensais**;
- cada missão é dividida em **até 5 micromissões**;
- as missões recorrentes se renovam de acordo com o dia, semana e mês;
- XP concedido por micromissão concluída, preservando o histórico acumulado;
- dias úteis priorizam conteúdo específico, questões, básicos e caderno de erros;
- sábado funciona como dia de **Boss técnico**;
- domingo concentra revisão e planejamento;
- metas mensais específicas para agosto, setembro, outubro e novembro de 2026.

### Cronograma

- página dedicada com visual híbrido de **Gantt + calendário**;
- fases: Tutorial, Reconhecimento, Leveling, Raids, Endgame, Buff Final e Final Boss;
- targets de nota: **30/50 → 35/50 → 39/50 → 42+/50**;
- marcos de diagnóstico e simulados;
- calendário mensal navegável;
- quando a data oficial da prova for informada em Configurações, o app calcula automaticamente **D-21**, **D-7** e o Final Boss;
- enquanto o dia oficial não estiver configurado, novembro aparece apenas como horizonte de planejamento, sem inventar uma data de prova.

### Caderno de erros

Cada erro possui quatro campos independentes:

1. questão / referência;
2. minha resposta / raciocínio;
3. gabarito / solução correta;
4. causa do erro + regra anti-erro.

O botão **+** cria novos blocos. O conteúdo salva automaticamente no navegador. Se havia texto no caderno livre da versão anterior, ele é migrado para um bloco de erro ao carregar a versão nova.

### Central de recursos

Página de acesso rápido organizada por categoria:

- páginas oficiais da Transpetro;
- prova anterior de Engenharia Mecânica;
- páginas de prova e gabarito;
- bancos de questões;
- cursos e planos de estudo.

Os links externos continuam sujeitos às regras de acesso de cada plataforma.

### Simulador interno

O aplicativo possui um simulador automático de 5, 10 ou 20 questões, com blocos de específicas, básicas ou misto.

**Política de origem das questões:**

- questões históricas reais não são copiadas para o repositório; a Central de Recursos abre a prova anterior na fonte;
- o banco interno contém somente questões **AUTORAIS**;
- toda questão interna aparece explicitamente marcada como **AUTORAL** e **PADRÃO CESGRANRIO**;
- as questões usam cinco alternativas e conteúdo compatível com a estrutura da preparação, sem se apresentar como questões oficiais ou históricas.

## Compatibilidade com versões anteriores

A aplicação preserva a chave de armazenamento `transpetro_strategy_v1` para manter o progresso local existente. A sincronização em nuvem é adicional: o estado local continua disponível offline e pode ser enviado ao banco quando a conexão retornar.

## Executar localmente

Para testar apenas o frontend:

```bash
python -m http.server 8000
```

Para testar também as Vercel Functions, use Vercel CLI com as variáveis locais configuradas.

## Dados

O progresso local continua salvo no `localStorage`. O modo cloud usa o registro JSONB no Postgres. Faça backups periódicos em **Configurações → Exportar backup**.
