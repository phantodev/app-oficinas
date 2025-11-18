-- ============================================
-- MIGRATION: Schema Inicial do Sistema
-- Descrição: Cria todas as tabelas necessárias para o sistema de oficina
-- Data: 2025-01-XX
-- ============================================

-- ============================================
-- 1. TABELA: clientes
-- Descrição: Armazena dados dos clientes da oficina
-- ============================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR NOT NULL,
    telefone VARCHAR NOT NULL,
    cpf VARCHAR UNIQUE,
    email VARCHAR,
    endereco TEXT,
    tipo TEXT CHECK (tipo IN ('PF', 'PJ')),
    documento TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.clientes IS 'Tabela para armazenar dados dos clientes da oficina';
COMMENT ON COLUMN public.clientes.cpf IS 'CPF do cliente (único)';
COMMENT ON COLUMN public.clientes.tipo IS 'PF para Pessoa Física, PJ para Pessoa Jurídica';
COMMENT ON COLUMN public.clientes.documento IS 'CPF para PF, CNPJ para PJ (único)';

-- ============================================
-- 2. TABELA: veiculos
-- Descrição: Armazena informações dos veículos
-- ============================================
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa TEXT NOT NULL UNIQUE,
    cliente_id UUID NOT NULL,
    marca TEXT,
    modelo TEXT,
    ano INTEGER,
    cor TEXT,
    chassi TEXT,
    renavam TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT veiculos_cliente_id_fkey 
        FOREIGN KEY (cliente_id) 
        REFERENCES public.clientes(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE public.veiculos IS 'Armazena informações dos veículos';
COMMENT ON COLUMN public.veiculos.placa IS 'Placa única do veículo (identificador principal para busca)';

-- ============================================
-- 3. TABELA: entradas
-- Descrição: Tabela para armazenar check-in e check-out de veículos na oficina
-- ============================================
CREATE TABLE IF NOT EXISTS public.entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR NOT NULL UNIQUE,
    marca VARCHAR,
    modelo VARCHAR,
    ano INTEGER,
    cor VARCHAR,
    tipo_veiculo VARCHAR DEFAULT 'carro',
    data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
    quilometragem INTEGER,
    tipo_servico VARCHAR,
    descricao_problema TEXT,
    status VARCHAR DEFAULT 'aguardando' 
        CHECK (status IN ('aguardando', 'em_atendimento', 'finalizado', 'cancelado')),
    data_prevista_saida TIMESTAMPTZ,
    observacoes TEXT,
    data_saida TIMESTAMPTZ,
    servicos_realizados TEXT,
    valor_total NUMERIC,
    status_pagamento VARCHAR 
        CHECK (status_pagamento IN ('pendente', 'pago', 'parcelado')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    cliente_id UUID,
    veiculo_id UUID,
    usuario_id UUID,
    
    CONSTRAINT entradas_cliente_id_fkey 
        FOREIGN KEY (cliente_id) 
        REFERENCES public.clientes(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT entradas_veiculo_id_fkey 
        FOREIGN KEY (veiculo_id) 
        REFERENCES public.veiculos(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT entradas_usuario_id_fkey 
        FOREIGN KEY (usuario_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL
);

COMMENT ON TABLE public.entradas IS 'Tabela para armazenar check-in e check-out de veículos na oficina';
COMMENT ON COLUMN public.entradas.placa IS 'Placa do veículo (identificador único)';
COMMENT ON COLUMN public.entradas.status IS 'Status do atendimento: aguardando, em_atendimento, finalizado, cancelado';
COMMENT ON COLUMN public.entradas.status_pagamento IS 'Status do pagamento: pendente, pago, parcelado';
COMMENT ON COLUMN public.entradas.cliente_id IS 'Referência ao cliente (foreign key para tabela clientes)';
COMMENT ON COLUMN public.entradas.veiculo_id IS 'Referência ao veículo na tabela veiculos (pode ser NULL para compatibilidade com registros antigos)';
COMMENT ON COLUMN public.entradas.usuario_id IS 'Referência ao usuário autenticado que criou/registrou a entrada';

-- ============================================
-- 4. ÍNDICES para melhorar performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON public.veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entradas_cliente_id ON public.entradas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entradas_veiculo_id ON public.entradas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_entradas_status ON public.entradas(status);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes(cpf) WHERE cpf IS NOT NULL;

-- ============================================
-- 5. FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veiculos_updated_at
    BEFORE UPDATE ON public.veiculos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entradas_updated_at
    BEFORE UPDATE ON public.entradas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Usuários autenticados podem ver clientes"
    ON public.clientes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem inserir clientes"
    ON public.clientes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
    ON public.clientes FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar clientes"
    ON public.clientes FOR DELETE
    TO authenticated
    USING (true);

-- Políticas para veículos
CREATE POLICY "Usuários autenticados podem ver veículos"
    ON public.veiculos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem inserir veículos"
    ON public.veiculos FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar veículos"
    ON public.veiculos FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar veículos"
    ON public.veiculos FOR DELETE
    TO authenticated
    USING (true);

-- Políticas para entradas
CREATE POLICY "Usuários autenticados podem ver entradas"
    ON public.entradas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem inserir entradas"
    ON public.entradas FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar entradas"
    ON public.entradas FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar entradas"
    ON public.entradas FOR DELETE
    TO authenticated
    USING (true);

