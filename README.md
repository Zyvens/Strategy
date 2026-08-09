# Operação Transpetro — Strategy

PWA gamificado para preparação do PSP 004/2026 da Transpetro.

## O que o app faz

- campanha completa em fases: Tutorial, Reconhecimento, Leveling, Raids, Endgame, Buff Final e Final Boss;
- XP, níveis, streak e progresso de missões;
- missões de diagnóstico para Engenharia Mecânica, Comércio e Suprimentos e Transporte Marítimo;
- metas de desempenho de 30/50 → 35/50 → 39/50 → 42/50;
- registro de simulados e melhor resultado;
- cronômetro de estudo;
- árvore de conteúdo por trilha/cargo;
- caderno de erros com salvamento automático;
- missões personalizadas;
- backup/importação de progresso em JSON;
- funcionamento offline via Service Worker;
- instalação como PWA em navegadores compatíveis.

## Trilha inicial

O aplicativo inicia em **Engenharia Mecânica — RJ** e permite trocar para:

- Engenharia Mecânica — SP;
- Comércio e Suprimentos — RJ;
- Transporte Marítimo — RJ;
- Engenharia de Inspeção — RJ.

Os quantitativos 2026 mostrados no aplicativo são referências preliminares já discutidas e devem ser atualizados quando o edital de abertura consolidar o quadro definitivo pós-sorteio.

## Executar localmente

Por causa do Service Worker, use um servidor HTTP local em vez de abrir o arquivo diretamente:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## GitHub Pages

O projeto é 100% estático. Para publicar, habilite **Settings → Pages → Deploy from a branch**, escolha `main` e `/ (root)`.

## Dados

O progresso é salvo no `localStorage` do navegador. Use **Configurações → Exportar backup** para preservar os dados antes de limpar o navegador ou trocar de aparelho.
