# Operação Transpetro — Strategy

PWA gamificado para preparação do PSP 004/2026 da Transpetro.

## Versão 2.0

A campanha agora transforma os objetivos maiores em execução recorrente e mensurável.

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

O aplicativo também possui um simulador automático de 5, 10 ou 20 questões, com blocos de específicas, básicas ou misto.

**Política de origem das questões:**

- questões históricas reais não são copiadas para o repositório; a Central de Recursos abre a prova anterior na fonte;
- o banco interno contém somente questões **AUTORAIS**;
- toda questão interna aparece explicitamente marcada como **AUTORAL** e **PADRÃO CESGRANRIO**;
- as questões usam cinco alternativas e conteúdo compatível com a estrutura da preparação, sem se apresentar como questões oficiais ou históricas.

### Outros recursos

- XP, níveis e streak;
- registro de simulados e melhor nota;
- cronômetro de estudo líquido com horas semanais;
- mapa de domínio por conteúdo e trilha;
- Engenharia Mecânica RJ como trilha inicial, com outras trilhas selecionáveis;
- backup e importação de progresso em JSON;
- funcionamento offline via Service Worker;
- instalação como PWA em navegadores compatíveis.

## Compatibilidade com a versão anterior

A versão 2 mantém a chave de armazenamento `transpetro_strategy_v1` para preservar o progresso existente. XP de missões antigas concluídas continua contabilizado e o antigo caderno livre é migrado quando necessário.

## Executar localmente

Por causa do Service Worker, use um servidor HTTP local em vez de abrir o arquivo diretamente:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## GitHub Pages

O projeto é 100% estático. Para publicar, habilite **Settings → Pages → Deploy from a branch**, escolha `main` e `/ (root)`.

## Dados

O progresso é salvo no `localStorage` do navegador. Use **Configurações → Exportar backup** antes de limpar o navegador ou trocar de aparelho.
