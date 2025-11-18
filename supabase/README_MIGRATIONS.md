# Migrations do Banco de Dados

Este diretório contém as migrations SQL necessárias para configurar o banco de dados do sistema de oficina.

## 📋 Estrutura das Tabelas

O sistema utiliza as seguintes tabelas:

### 1. **clientes**
Armazena dados dos clientes da oficina.

**Colunas principais:**
- `id` (UUID, PK)
- `nome` (VARCHAR, obrigatório)
- `telefone` (VARCHAR, obrigatório)
- `cpf` (VARCHAR, único)
- `email` (VARCHAR)
- `endereco` (TEXT)
- `tipo` (TEXT: 'PF' ou 'PJ')
- `documento` (TEXT)
- `observacoes` (TEXT)
- `ativo` (BOOLEAN, default: true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. **veiculos**
Armazena informações dos veículos.

**Colunas principais:**
- `id` (UUID, PK)
- `placa` (TEXT, obrigatório, único) - **Usado para busca no sistema**
- `cliente_id` (UUID, FK → clientes.id)
- `marca` (TEXT)
- `modelo` (TEXT)
- `ano` (INTEGER)
- `cor` (TEXT)
- `chassi` (TEXT)
- `renavam` (TEXT)
- `observacoes` (TEXT)
- `ativo` (BOOLEAN, default: true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3. **entradas**
Armazena check-in e check-out de veículos na oficina.

**Colunas principais:**
- `id` (UUID, PK)
- `placa` (VARCHAR, obrigatório, único)
- `marca`, `modelo`, `ano`, `cor` (dados do veículo)
- `tipo_veiculo` (VARCHAR, default: 'carro')
- `data_entrada` (TIMESTAMPTZ, obrigatório)
- `quilometragem` (INTEGER)
- `tipo_servico` (VARCHAR)
- `descricao_problema` (TEXT)
- `status` (VARCHAR: 'aguardando', 'em_atendimento', 'finalizado', 'cancelado')
- `data_prevista_saida` (TIMESTAMPTZ)
- `observacoes` (TEXT)
- `data_saida` (TIMESTAMPTZ)
- `servicos_realizados` (TEXT)
- `valor_total` (NUMERIC)
- `status_pagamento` (VARCHAR: 'pendente', 'pago', 'parcelado')
- `cliente_id` (UUID, FK → clientes.id)
- `veiculo_id` (UUID, FK → veiculos.id)
- `usuario_id` (UUID, FK → auth.users.id)
- `created_at`, `updated_at` (TIMESTAMPTZ)

## 🚀 Como Executar as Migrations

### Opção 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `001_initial_schema.sql`
4. Clique em **Run** para executar

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Aplicar migrations
supabase db push
```

### Opção 3: Via SQL direto

Se você estiver usando outro cliente PostgreSQL, pode executar o arquivo SQL diretamente:

```bash
psql -h seu-host -U seu-usuario -d seu-database -f supabase/migrations/001_initial_schema.sql
```

## 🔒 Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** habilitado com políticas que permitem:

- ✅ Usuários autenticados podem **ler** todos os registros
- ✅ Usuários autenticados podem **criar** novos registros
- ✅ Usuários autenticados podem **atualizar** registros
- ✅ Usuários autenticados podem **deletar** registros

> **Nota:** Em produção, você pode querer ajustar essas políticas para serem mais restritivas.

## 📝 Relacionamentos

```
clientes (1) ──< (N) veiculos
veiculos (1) ──< (N) entradas
clientes (1) ──< (N) entradas
auth.users (1) ──< (N) entradas
```

## 🔍 Índices Criados

Para melhorar a performance, foram criados índices em:

- `veiculos.placa` - Busca rápida por placa
- `veiculos.cliente_id` - Join com clientes
- `entradas.cliente_id` - Join com clientes
- `entradas.veiculo_id` - Join com veículos
- `entradas.status` - Filtros por status
- `clientes.cpf` - Busca por CPF (quando não nulo)

## ⚙️ Funcionalidades Automáticas

- **Triggers de `updated_at`**: Atualizam automaticamente o campo `updated_at` quando um registro é modificado
- **Valores padrão**: Campos como `created_at`, `updated_at`, `ativo` têm valores padrão

## 🧪 Dados de Teste (Opcional)

Após executar as migrations, você pode inserir dados de teste:

```sql
-- Inserir cliente de teste
INSERT INTO public.clientes (nome, telefone, email, endereco)
VALUES 
    ('João Silva', '(11) 99999-9999', 'joao@email.com', 'Rua Teste, 123'),
    ('Maria Santos', '(11) 88888-8888', 'maria@email.com', 'Av. Exemplo, 456');

-- Inserir veículo de teste
INSERT INTO public.veiculos (placa, cliente_id, marca, modelo, ano, cor)
VALUES 
    ('ABC1234', (SELECT id FROM public.clientes WHERE nome = 'João Silva' LIMIT 1), 'Toyota', 'Corolla', 2020, 'Branco'),
    ('XYZ5678', (SELECT id FROM public.clientes WHERE nome = 'Maria Santos' LIMIT 1), 'Honda', 'Civic', 2021, 'Preto');
```

## 📚 Referências

- [Documentação do Supabase](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

