# 🚀 Guia Rápido - Configuração do Banco de Dados

Este guia vai te ajudar a configurar o banco de dados do sistema de oficina em poucos minutos.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Projeto criado no Supabase

## ⚡ Passo a Passo

### 1️⃣ Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: `app-oficinas` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte (anote ela!)
   - **Region**: Escolha a região mais próxima
5. Clique em **"Create new project"**
6. Aguarde alguns minutos enquanto o projeto é criado

### 2️⃣ Executar as Migrations

#### Opção A: Via Dashboard (Mais Fácil) ⭐

1. No projeto criado, vá em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql`
4. Copie **TODO** o conteúdo do arquivo
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** (ou pressione `Ctrl+Enter`)
7. Aguarde a mensagem de sucesso ✅

#### Opção B: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto (você precisará do project ref)
supabase link --project-ref seu-project-ref

# Aplicar migrations
supabase db push
```

### 3️⃣ (Opcional) Inserir Dados de Teste

Se quiser dados de exemplo para testar:

1. No **SQL Editor**, abra o arquivo `supabase/migrations/002_seed_data.sql`
2. Copie e cole o conteúdo
3. Clique em **"Run"**

### 4️⃣ Configurar Variáveis de Ambiente

1. No Supabase Dashboard, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (URL do projeto)
   - **anon public** key (chave pública)
3. No seu projeto React Native, crie/edite o arquivo `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

Ou configure no `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://seu-project-ref.supabase.co",
      "supabaseAnonKey": "sua-anon-key-aqui"
    }
  }
}
```

## ✅ Verificação

Para verificar se tudo está funcionando:

1. No Supabase Dashboard, vá em **Table Editor**
2. Você deve ver 3 tabelas:
   - ✅ `clientes`
   - ✅ `veiculos`
   - ✅ `entradas`

3. Teste no app:
   - Execute o app
   - Vá na tela de Check-In
   - Digite uma placa de teste (ex: `ABC1234` se inseriu os dados de seed)
   - Clique no ícone de busca
   - Deve aparecer os dados do cliente! 🎉

## 🐛 Problemas Comuns

### Erro: "relation already exists"
- Significa que as tabelas já existem
- Você pode ignorar ou deletar as tabelas e executar novamente

### Erro: "permission denied"
- Verifique se está usando a chave `anon` (não a `service_role`)
- Verifique se o RLS está configurado corretamente

### Erro: "foreign key constraint"
- Certifique-se de executar as migrations na ordem:
  1. Primeiro `001_initial_schema.sql`
  2. Depois `002_seed_data.sql` (opcional)

## 📚 Próximos Passos

- ✅ Banco de dados configurado
- ✅ Tabelas criadas
- ✅ RLS habilitado
- ✅ Dados de teste inseridos (se aplicável)

Agora você pode usar o app normalmente! 🚀

## 💡 Dicas

- **Backup**: Sempre faça backup antes de executar migrations em produção
- **Testes**: Use os dados de seed apenas em desenvolvimento
- **Segurança**: Nunca compartilhe suas chaves de API
- **Documentação**: Consulte `README_MIGRATIONS.md` para mais detalhes

## 🆘 Precisa de Ajuda?

- [Documentação do Supabase](https://supabase.com/docs)
- [Comunidade Supabase](https://github.com/supabase/supabase/discussions)
- [SQL Editor Guide](https://supabase.com/docs/guides/database/tables)

