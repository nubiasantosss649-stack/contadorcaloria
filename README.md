# Caloria Fácil AI

Contador de calorias com inteligência artificial e assinaturas recorrentes, para **Android e iPhone**
(lançamento inicial nos EUA, com suporte internacional).

> **Status: Fase 1 — estrutura, arquitetura e design.**
> Login/cadastro funcionam de verdade **quando o Supabase é configurado**. O scanner de IA, o registro
> de refeições, o histórico, os gráficos de progresso e as compras ainda **não estão integrados** e as
> telas indicam isso claramente ("Em desenvolvimento"). Nenhum resultado é simulado.

## Stack

| Área        | Tecnologia                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| App         | Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 (strict)        |
| Navegação   | Expo Router (rotas por arquivo, `Stack.Protected` para rotas protegidas)    |
| Estilo      | NativeWind 4 (Tailwind CSS 3) · modo claro/escuro                           |
| Animações   | React Native Reanimated 4 + Worklets                                        |
| i18n        | i18next + react-i18next + expo-localization (en-US, pt-BR, es)              |
| Backend     | Supabase (Auth + Postgres) — cliente pronto, aguardando credenciais         |
| Assinaturas | Interface pronta para RevenueCat (Apple IAP / Google Play Billing)          |
| Qualidade   | ESLint (eslint-config-expo) · Prettier · Jest (jest-expo) · Testing Library |
| Builds      | EAS Build (`eas.json` com perfis development / preview / production)        |

## Requisitos

- **Node.js 20 LTS ou 22 LTS** e npm
- Celular com **Expo Go** (App Store / Google Play) — versão compatível com o SDK 57 — ou um emulador
- Opcional: Android Studio (emulador Android) e/ou Xcode (simulador iOS, só no macOS)
- Opcional: conta Expo (`npx eas-cli@latest login`) para builds na nuvem

## Como executar

```bash
git clone <url-do-repositorio>
cd contadorcaloria
npm install
cp .env.example .env      # preencha as variáveis (ver "Variáveis de ambiente")
npm start                 # inicia o Metro bundler e mostra um QR code
```

### No computador

- **Navegador:** pressione `w` no terminal do `npm start` (ou `npm run web`).
- **Emulador Android:** abra um emulador no Android Studio e pressione `a`.
- **Simulador iOS (macOS):** pressione `i`.

### No celular (Expo Go)

1. Instale o **Expo Go** no celular.
2. Deixe celular e computador na **mesma rede Wi-Fi**.
3. Rode `npm start` e escaneie o QR code (Android: pelo app Expo Go; iPhone: pela câmera).
4. Se a rede bloquear a conexão (Wi-Fi corporativo, VPN), use `npx expo start --tunnel`.

> Tudo o que a Fase 1 usa está incluído no Expo Go. Quando entrarem módulos nativos extras
> (RevenueCat, câmera avançada), será necessário um **development build** (veja "Builds").

### Sem Supabase configurado

Sem as variáveis do Supabase, as telas de login/cadastro mostram o aviso **"Backend não configurado"** e
os formulários ficam desativados. Em modo de desenvolvimento aparece o botão
**"Explorar a interface (prévia)"**, que abre as telas autenticadas sem conta, com o selo
"Modo prévia". Esse botão **não existe em builds de produção** e nada é salvo.

## Variáveis de ambiente

Copie `.env.example` para `.env`. Variáveis `EXPO_PUBLIC_*` vão para o app compilado — **nunca** coloque
segredos (ex.: service role key) nelas.

| Variável                             | Uso                                                  |
| ------------------------------------ | ---------------------------------------------------- |
| `EXPO_PUBLIC_APP_ENV`                | `development` · `preview` · `production`             |
| `EXPO_PUBLIC_SUPABASE_URL`           | URL do projeto Supabase                              |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`      | Chave pública (anon/publishable)                     |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY`     | Fase 2 — chave pública do RevenueCat (iOS)           |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Fase 2 — chave pública do RevenueCat (Android)       |
| `EXPO_PUBLIC_TERMS_URL`              | URL dos Termos de Uso (exigido pela App Store)       |
| `EXPO_PUBLIC_PRIVACY_URL`            | URL da Política de Privacidade (exigido pelas lojas) |

Após alterar o `.env`, reinicie com `npm run start:clear`.

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie a URL e a chave anon para o `.env`.
3. Rode a migração inicial `supabase/migrations/0001_init.sql` (SQL Editor ou `supabase db push`).
   Ela cria a tabela `profiles` com RLS e um gatilho que cria o perfil no cadastro.
4. Em **Authentication → URL Configuration**, adicione `caloriafacil://**` às Redirect URLs
   (links de confirmação de e-mail e de redefinição de senha).
5. Depois que o projeto existir, gere os tipos reais:
   `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`

## Scripts

| Comando               | Descrição                                            |
| --------------------- | ---------------------------------------------------- |
| `npm start`           | Inicia o servidor de desenvolvimento                 |
| `npm run start:clear` | Inicia limpando o cache do Metro                     |
| `npm run web`         | Abre no navegador                                    |
| `npm run typecheck`   | TypeScript (`tsc --noEmit`)                          |
| `npm run lint`        | ESLint                                               |
| `npm run format`      | Prettier (formata)                                   |
| `npm test`            | Testes (Jest)                                        |
| `npm run validate`    | typecheck + lint + format:check + testes             |
| `npm run doctor`      | `expo-doctor` (verifica dependências e configuração) |

## Estrutura

```
src/
  app/                      Rotas (Expo Router)
    _layout.tsx             Providers, fontes, splash, guardas de rota
    language.tsx            Seleção de idioma (acessível de qualquer lugar)
    (onboarding)/           Boas-vindas, apresentação das funcionalidades
    (auth)/                 Login, cadastro, recuperar senha
    (app)/                  Área autenticada
      (tabs)/               Home, Food Diary, AI Scanner, Progress, Profile
      add-meal.tsx          Adicionar refeição (modal)
      paywall.tsx           Assinatura Pro (modal)
      settings.tsx          Configurações
  components/
    ui/                     Design system: Button, TextField, Card, ProgressBar, ProgressRing,
                            BarChart, AppModal, SegmentedControl, ListItem, Badge, Screen…
    brand/                  Logo e splash animada
  features/                 Módulos de domínio (auth, preferences, subscriptions, meals)
  services/                 Integrações externas (auth Supabase, compras)
  hooks/                    Hooks compartilhados (tema, saudação)
  lib/                      env, supabase, i18n, unidades, validação, storage, datas
  constants/                Paleta e tokens de tema
  locales/                  en-US (fonte da verdade), pt-BR, es
  types/                    Tipos globais (banco, i18next)
assets/                     Ícone, splash, ícones adaptativos Android
supabase/migrations/        SQL do banco
tests/                      Testes Jest
```

### Decisões de arquitetura

- **Rotas protegidas:** `Stack.Protected` no layout raiz decide entre onboarding → autenticação → app.
  Concluir o onboarding ou entrar/sair redireciona automaticamente.
- **i18n tipado:** `src/locales/en-US.ts` é a fonte das chaves; `pt-BR` e `es` são tipados contra ela,
  então uma chave faltando quebra o `typecheck`. Um teste também compara chaves e placeholders.
  Nenhum texto de interface fica fixo nos componentes.
- **Idioma:** detectado pelo aparelho (`expo-localization`) — qualquer variante de português → pt-BR,
  de espanhol → es, demais → en-US. A escolha manual é salva no aparelho.
- **Unidades:** valores são sempre armazenados em métrico (kg, cm, kcal) e convertidos na exibição.
  Padrão imperial para regiões dos EUA, métrico para as demais; o usuário pode trocar nas Configurações.
- **Tema:** claro, escuro ou do sistema (persistido).
- **Assinaturas:** `src/features/subscriptions/plans.ts` define os planos com preços **demonstrativos**;
  `src/services/purchases-service.ts` define a interface que o RevenueCat implementará. Hoje o serviço
  sempre responde "indisponível" — nenhuma compra é simulada.

## Builds Android e iOS (EAS)

```bash
npm install -g eas-cli          # ou use npx eas-cli@latest
eas login
eas init                        # vincula o projeto à sua conta (grava o projectId no app.json)
eas build --profile development --platform android   # development build (APK interno)
eas build --profile preview --platform all           # build interna para testadores
eas build --profile production --platform all        # build para as lojas
eas submit --platform ios|android
```

Configure as variáveis `EXPO_PUBLIC_*` também no EAS (`eas env:create` ou no painel expo.dev) para cada
ambiente — o `.env` local não é enviado para builds na nuvem.

Antes do primeiro build de produção, confirme o identificador `com.caloriafacil.ai`
(`ios.bundleIdentifier` / `android.package` em `app.json`) — ele não pode ser alterado depois de publicado.

## Dependências externas pendentes

| Item                                          | Situação                                                            |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Projeto Supabase + credenciais                | **Pendente** — sem ele login/cadastro ficam desativados             |
| Conta Expo / EAS (`eas init`)                 | **Pendente** — necessária para builds na nuvem                      |
| Apple Developer Program / Google Play Console | **Pendente** — publicação e produtos de assinatura                  |
| RevenueCat (projeto, produtos, chaves)        | **Pendente — Fase 2**                                               |
| Serviço de IA para o scanner de fotos         | **Pendente** — a definir                                            |
| Banco de alimentos (busca)                    | **Pendente** — a definir                                            |
| Termos de Uso e Política de Privacidade       | **Pendente** — URLs exigidas pelas lojas                            |
| Ícone e splash definitivos                    | Arte provisória gerada nesta fase; substituir pela identidade final |

## Próximas fases (sugestão)

1. Perfil corporal e cálculo de meta calórica; persistência de refeições no Supabase.
2. RevenueCat + development build; paywall com preços reais vindos das lojas.
3. Scanner de IA (câmera + análise de imagem), histórico e gráficos com dados reais.
