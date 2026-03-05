# 🏍️ StreetBike — Guia Completo para Iniciante

---

## ✅ O que você precisa instalar no PC (só uma vez)

1. **Node.js** → https://nodejs.org (baixe a versão LTS)
2. **Android Studio** → https://developer.android.com/studio
3. **VS Code** → já tem ✅

---

## 🔥 Ativar no Firebase Console (IMPORTANTE)

Acesse https://console.firebase.google.com → seu projeto **controle-residencial-5d270**

### Ativar Autenticação:
- Menu esquerdo → **Authentication** → **Get started**
- Aba **Sign-in method** → clique em **Email/Password** → Ativar → Salvar

### Ativar Firestore:
- Menu esquerdo → **Firestore Database** → **Create database**
- Escolha **Start in test mode** → Avançar → Criar

---

## 🚀 Rodar o projeto (passo a passo)

### Passo 1 — Abrir no VS Code
Extraia o ZIP e abra a pasta `streetbike-final` no VS Code

### Passo 2 — Instalar dependências
No terminal do VS Code (Ctrl + '):
```bash
npm install
```

### Passo 3 — Testar no navegador primeiro
```bash
npm start
```
Abra http://localhost:3000 no Chrome
✅ Se aparecer a tela do StreetBike, está funcionando!

### Passo 4 — Gerar APK para Android
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
Vai abrir o Android Studio.
No Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## 👑 Criar seu usuário Admin

1. Abra http://localhost:3000
2. Crie uma conta normalmente
3. Acesse https://console.firebase.google.com
4. Firestore Database → Collection **users** → clique no seu usuário
5. Clique em **Editar** → adicione o campo:
   - Campo: `isAdmin`
   - Tipo: `boolean`
   - Valor: `true`
6. Salve e faça login novamente → vai entrar no Painel Admin!

---

## 📱 Funcionalidades do App

### Para Usuários:
- 🔐 Login / Cadastro / Recuperação de senha
- ⏰ Acesso válido por **30 dias** após cadastro
- 📰 Feed de publicações com curtidas
- 🗺️ Rotas com dificuldade (Fácil/Moderado/Difícil/Extremo)
- 📅 Eventos com inscrição
- 🔧 Controle de manutenção da bike
- 🛒 Classificados (compra e venda)
- 🔔 Notificações
- 👤 Perfil com estatísticas

### Para Admin:
- 📊 Dashboard: Total / Ativos / Expirando / Expirados
- ✅ Renovar acesso: 30/60/90/180/365 dias
- 🚫 Bloquear/Desbloquear usuários
- 💬 Enviar mensagem para usuário específico
- 📢 Broadcast para TODOS os usuários
- 🔍 Busca e filtros por status

---

## ❓ Problemas comuns

**"Firebase: Error (auth/configuration-not-found)"**
→ Ative o Email/Password na Authentication do Firebase

**"Missing or insufficient permissions"**
→ No Firestore, certifique-se de estar em modo teste (test mode)

**App não abre no celular**
→ Certifique-se de ter o Android Studio instalado e um dispositivo/emulador configurado

---

## 📞 Estrutura dos arquivos

```
streetbike-final/
  ├── src/
  │   ├── index.html              ← App completo (telas, estilos, lógica)
  │   └── services/
  │       └── firebase.js         ← Conexão com Firebase (já configurado!)
  ├── package.json
  ├── capacitor.config.json
  └── README.md
```
