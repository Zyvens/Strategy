# Neon Cloud Sync

Este projeto usa **GitHub Pages + Neon Postgres**. Vercel não faz parte da arquitetura.

## Componentes

- **GitHub Pages**: hospedagem do PWA.
- **Service Worker + localStorage**: funcionamento offline.
- **Neon Auth**: login por usuário.
- **Neon Data API**: acesso HTTPS autenticado ao banco.
- **Neon Postgres**: estado persistente compartilhado entre dispositivos.
- **RLS**: garante que cada usuário acesse somente o próprio registro.

## Projeto Neon

Projeto: `Strategy Transpetro`

A configuração do frontend usa somente os endpoints públicos de Auth e Data API. A connection string administrativa não é necessária no navegador e não deve ser adicionada ao repositório.

## Como usar

### Primeiro dispositivo

1. Abra o app no GitHub Pages.
2. Vá a **Configurações → Neon Postgres**.
3. Crie uma conta com e-mail e senha.
4. Se o Neon estiver vazio, o progresso local existente é enviado para a nuvem.

### Segundo dispositivo

1. Abra a mesma URL do GitHub Pages.
2. Entre com a mesma conta.
3. Se o dispositivo estiver com o estado padrão, o app baixa a versão do Neon automaticamente.

### Conflitos

Se um dispositivo tiver alterações locais não enviadas e outro também tiver alterado a nuvem, o app interrompe a sincronização automática e mostra duas opções:

- **Usar versão do Neon** — descarta a versão local divergente;
- **Usar este dispositivo** — sobrescreve a versão remota com o estado local.

## Sincronização automática

O sincronizador observa mudanças no registro local usado pelo app e envia o estado após um pequeno debounce. Também verifica a nuvem:

- ao abrir o app;
- ao voltar a ficar online;
- ao focar novamente a janela;
- periodicamente enquanto a página está visível.

## Segurança

A Data API é autenticada por JWT emitido pelo Neon Auth. O token é gerenciado pelo SDK oficial `@neondatabase/neon-js`.

O banco não confia apenas no frontend: Row-Level Security valida `auth.user_id()` em todas as operações sobre o estado do Strategy.

Não armazene no GitHub:

- `DATABASE_URL`;
- senha do Postgres;
- API key administrativa do Neon.

Nenhum desses segredos é necessário para o PWA em produção.

## Cache e atualização do PWA

O Service Worker usa um nome de cache versionado. Quando o sincronizador muda, a versão do cache também deve ser incrementada para que instalações antigas recebam os novos arquivos.

Se uma instalação parecer presa em versão antiga, feche e reabra o PWA; em último caso, remova e instale novamente a partir da URL atual do GitHub Pages.
