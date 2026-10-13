# Caloria Fácil AI

Contador de calorias com inteligência artificial e assinaturas recorrentes, para **Android e iPhone**
(lançamento inicial nos EUA, com suporte internacional).

> **Status: Fase 2 — autenticação, banco de dados, onboarding e contador de calorias.**
> Com o Supabase configurado, o app tem cadastro/login reais, questionário inicial, metas estimadas,
> registro de alimentos, dashboard, histórico, peso, favoritos e exclusão de conta.
> Ainda **não** estão integrados: scanner de IA, compras/assinatura Pro (Fase 3), notificações e
> importação dos bancos USDA / Open Food Facts (adaptadores prontos, sem chamada no app).
> Essas áreas mostram "Em desenvolvimento". Nenhum dado nutricional é inventado.

## Stack

| Área        | Tecnologia                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| App         | Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 (strict)         |
| Navegação   | Expo Router (`Stack.Protected` para rotas protegidas e questionário inicial) |
| Estilo      | NativeWind 4 (Tailwind CSS 3) · modo claro/escuro                            |
| Animações   | React Native Reanimated 4 + Worklets                                         |
| i18n        | i18next + react-i18next + expo-localization (en-US, pt-BR, es)               |
| Dados       | Supabase (Auth + Postgres + RLS) · TanStack Query (cache e atualização)      |
| Sessão      | Criptografada: chave AES no Keychain/Keystore (expo-secure-store)            |
| Assinaturas | Interface pronta para RevenueCat (Apple IAP / Google Play Billing) — Fase 3  |
| Qualidade   | ESLint · Prettier · Jest + Testing Library · testes SQL com PGlite           |
| Builds      | EAS Build (`eas.json` com perfis development / preview / production)         |

## Requisitos

- **Node.js 20 LTS ou 22 LTS** e npm
- Celular com **Expo Go** (versão compatível com o SDK 57) ou um emulador
- Um projeto **Supabase** (gratuito) para usar login e dados reais
- Opcional: Android Studio / Xcode (emuladores) e conta Expo para builds na nuvem

## Como executar

```bash
git clone <url-do-repositorio>
cd contadorcaloria
npm install
cp .env.example .env      # preencha URL e chave do Supabase (ver abaixo)
npm start                 # Metro bundler + QR code
```

- **Navegador:** `w` no terminal do `npm start` (ou `npm run web`).
- **Emulador Android:** abra um emulador no Android Studio e pressione `a`.
- **Simulador iOS (macOS):** pressione `i`.

### Testar no celular (Android e iPhone)

1. Instale o **Expo Go** (Google Play / App Store).
2. Celular e computador na **mesma rede Wi-Fi** (ou use `npx expo start --tunnel`).
3. `npm start` e escaneie o QR code (Android: dentro do Expo Go; iPhone: pela câmera).
4. Roteiro sugerido:
   1. Criar conta → confirmar o e-mail **no próprio celular** (o link abre o app).
   2. Responder o questionário (ou pular perguntas) → ver a meta estimada → salvar.
   3. Home → `+` em uma refeição → **Cadastrar alimento** (valores do rótulo) → informar a porção em
      gramas → salvar. Conferir consumido/restante/macros no dashboard.
   4. Tocar no item → mudar gramas ou excluir → o dashboard atualiza sozinho.
   5. Diário: navegar pelos dias (plano grátis limita a 7 dias); salvar uma refeição como favorita.
   6. Progresso → registrar peso. Perfil → editar nome, metas, idioma, unidades, conta.
   7. Sair → "Esqueceu a senha?" → abrir o link do e-mail → definir nova senha.

Tudo o que a Fase 2 usa está incluído no Expo Go. Para testar **links de e-mail em builds** (não Expo
Go), gere um development build: `npx eas-cli@latest build --profile development --platform android|ios`.

### Sem Supabase configurado

As telas de login mostram **"Backend não configurado"**. Em desenvolvimento existe o botão
**"Explorar a interface (prévia)"**, que abre as telas sem conta e **sem salvar nada** (os formulários
de dados ficam desativados). Ele não existe em builds de produção.

## Variáveis de ambiente

Copie `.env.example` para `.env`. Variáveis `EXPO_PUBLIC_*` vão para dentro do app — **nunca** coloque
segredos nelas (service role key, chaves de API privadas).

| Variável                             | Obrigatória | Uso                                      |
| ------------------------------------ | ----------- | ---------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`           | Sim         | URL do projeto Supabase                  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`      | Sim         | Chave pública (anon / publishable)       |
| `EXPO_PUBLIC_APP_ENV`                | Não         | `development` · `preview` · `production` |
| `EXPO_PUBLIC_TERMS_URL`              | Para lojas  | URL dos Termos de Uso                    |
| `EXPO_PUBLIC_PRIVACY_URL`            | Para lojas  | URL da Política de Privacidade           |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY`     | Fase 3      | Chave pública do RevenueCat (iOS)        |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Fase 3      | Chave pública do RevenueCat (Android)    |

Depois de alterar o `.env`, reinicie com `npm run start:clear`. Para builds EAS, cadastre as mesmas
variáveis no EAS (`npx eas-cli@latest env:create`) — o `.env` local não é enviado.

## Conectar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. **Project Settings → API**: copie a _Project URL_ e a chave _anon/publishable_ para o `.env`.
3. **Aplique as migrações**, em ordem (SQL Editor → cole e execute cada arquivo, ou use a CLI):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_phase2_core.sql`

   Com a CLI: `npx supabase link --project-ref <ref>` e `npx supabase db push`.

4. **Authentication → URL Configuration → Redirect URLs**, adicione:
   - `caloriafacil://**` (builds do app)
   - `exp://**` (Expo Go durante o desenvolvimento)
   - `http://localhost:8081/**` (versão web local, opcional)
5. **Authentication → Providers → Email**: mantenha _Confirm email_ ligado (recomendado).
6. (Opcional, recomendado para produção) Em **Authentication → Email Templates**, configure um SMTP
   próprio — o SMTP padrão do Supabase tem limite baixo de envios.
7. Rode o app, crie uma conta e confirme o e-mail.

Para conceder Pro manualmente a um usuário de teste (somente pelo painel/SQL, nunca pelo app):

```sql
insert into public.user_entitlements (user_id, entitlement, source)
values ('<uuid-do-usuario>', 'pro', 'manual_grant');
```

### Banco de dados

| Tabela                                   | Conteúdo                                                          |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `profiles`                               | nome, e-mail, idioma, país, conclusão do questionário             |
| `user_preferences`                       | unidades, tema, preferências de notificação                       |
| `health_profiles`                        | objetivo, sexo, ano de nascimento, altura, nível de atividade     |
| `nutrition_goals`                        | meta diária de calorias e macros (estimada ou manual)             |
| `foods`                                  | catálogo compartilhado (USDA/OFF) + alimentos privados do usuário |
| `meal_entries` / `meal_items`            | refeições e porções; calorias/macros calculadas por gatilho       |
| `favorite_meals` / `favorite_meal_items` | refeições favoritas                                               |
| `weight_logs`                            | histórico de peso                                                 |
| `user_entitlements`                      | acesso Pro — **somente o servidor** (service role) escreve        |

Segurança aplicada no banco:

- **RLS em todas as tabelas**; cada usuário só lê/escreve as próprias linhas (`auth.uid()`).
- Alimentos do usuário são privados; o catálogo é somente leitura.
- Colunas sensíveis protegidas por permissões por coluna (e-mail, valores calculados, assinatura).
- Calorias/macros de cada porção são calculadas **no banco** a partir do alimento e dos gramas.
- Histórico: plano grátis vê 7 dias; Pro é verificado no servidor (`has_pro_access()`).
- Restrições de validação (peso 20–500 kg, meta ≥ 1200 kcal, macros ≤ 100 g por 100 g etc.).
- `delete_own_account()` exclui o usuário e **todos** os dados pessoais em cascata.

## Scripts

| Comando             | Descrição                                                   |
| ------------------- | ----------------------------------------------------------- |
| `npm start`         | Servidor de desenvolvimento                                 |
| `npm run typecheck` | TypeScript                                                  |
| `npm run lint`      | ESLint                                                      |
| `npm test`          | Testes do app (Jest)                                        |
| `npm run test:db`   | Testes do banco: migrações reais + RLS em Postgres (PGlite) |
| `npm run validate`  | Tudo acima + verificação de formatação                      |
| `npm run doctor`    | `expo-doctor`                                               |

## Estrutura

```
src/
  app/                       Rotas (Expo Router)
    _layout.tsx              Providers, guardas (intro → login → app / nova senha)
    auth/callback.tsx        Destino dos links de e-mail (confirmação e recuperação)
    reset-password.tsx       Definir nova senha
    (onboarding)/            Boas-vindas e apresentação (antes do login)
    (auth)/                  Login, cadastro, recuperar senha
    (app)/                   Área autenticada
      setup.tsx              Questionário inicial (obrigatório 1x por conta)
      (tabs)/                Home, Food Diary, AI Scanner, Progress, Profile
      add-meal.tsx           Busca, recentes, favoritas, porções em gramas
      create-food.tsx        Cadastro manual de alimento
      goals.tsx              Recalcular/editar metas
      edit-profile.tsx, account.tsx, settings.tsx, paywall.tsx
  features/                  Domínios: account, auth, meals, preferences, subscriptions
  services/                  Supabase (auth, conta, alimentos, refeições) + provedores USDA/OFF
  lib/                       nutrition (cálculos), energy (estimativa), datas, unidades, i18n…
  locales/                   en-US (fonte), pt-BR, es
supabase/migrations/         SQL (0001, 0002)
tests/                       Jest (lógica e telas) · tests/db (SQL/RLS)
```

### Metodologia da meta calórica

- **Mifflin-St Jeor** (TMB) × fator de atividade (1,2 – 1,9) = manutenção estimada.
- Objetivo: perder −500 kcal, manter 0, ganhar +300 kcal.
- **Proteções:** mínimo de 1200 kcal (mulheres) / 1500 kcal (homens), déficit máximo de 25% da
  manutenção, meta manual nunca abaixo de 1200 kcal (também imposto no banco), sem estimativa para
  menores de 18 anos.
- Macros sugeridos: 25% proteína, 45% carboidrato, 30% gordura.
- Faltando dados (ex.: sexo), o app explica o que falta e permite definir a meta manualmente.
- O app sempre apresenta como **estimativa**, não prescrição médica.

### Cálculo nutricional

`valor por 100 g × gramas ÷ 100`, arredondado a 1 casa decimal (mesma regra no app e no banco).
Ex.: 200 kcal/100 g × 150 g = **300 kcal**. Nutriente desconhecido fica **vazio** (nunca 0) e o
dashboard avisa que o total pode estar incompleto.

## Apple Sign-In e Google Sign-In (preparado)

`authService.signInWithProvider('apple' | 'google')` já existe e hoje retorna "não disponível".
Para ativar: habilitar os provedores no Supabase, adicionar `expo-apple-authentication` e o SDK do
Google Sign-In (exigem development build) e trocar a implementação por `signInWithIdToken`.
A Apple exige Sign in with Apple se houver outro login social no iOS.

## Builds Android e iOS (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile preview --platform all
npx eas-cli@latest build --profile production --platform all
```

Confirme o identificador `com.caloriafacil.ai` em `app.json` antes do primeiro build de produção.
