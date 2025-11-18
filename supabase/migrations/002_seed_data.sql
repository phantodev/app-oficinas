-- ============================================
-- MIGRATION: Dados de Exemplo (Seed Data)
-- Descrição: Insere dados de teste para desenvolvimento
-- ATENÇÃO: Execute apenas em ambiente de desenvolvimento/teste
-- ============================================

-- Limpar dados existentes (opcional - descomente se quiser resetar)
-- TRUNCATE TABLE public.entradas CASCADE;
-- TRUNCATE TABLE public.veiculos CASCADE;
-- TRUNCATE TABLE public.clientes CASCADE;

-- ============================================
-- 1. INSERIR CLIENTES DE EXEMPLO
-- ============================================
INSERT INTO public.clientes (nome, telefone, email, endereco, cpf, tipo, documento)
VALUES 
    (
        'João Silva',
        '(11) 99999-9999',
        'joao.silva@email.com',
        'Rua das Flores, 123 - São Paulo, SP',
        '123.456.789-00',
        'PF',
        '123.456.789-00'
    ),
    (
        'Maria Santos',
        '(11) 88888-8888',
        'maria.santos@email.com',
        'Avenida Paulista, 1000 - São Paulo, SP',
        '987.654.321-00',
        'PF',
        '987.654.321-00'
    ),
    (
        'Pedro Oliveira',
        '(11) 77777-7777',
        'pedro.oliveira@email.com',
        'Rua Augusta, 500 - São Paulo, SP',
        '111.222.333-44',
        'PF',
        '111.222.333-44'
    ),
    (
        'Empresa ABC Ltda',
        '(11) 66666-6666',
        'contato@empresaabc.com.br',
        'Rua Comercial, 789 - São Paulo, SP',
        NULL,
        'PJ',
        '12.345.678/0001-90'
    )
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- 2. INSERIR VEÍCULOS DE EXEMPLO
-- ============================================
INSERT INTO public.veiculos (placa, cliente_id, marca, modelo, ano, cor, chassi, renavam)
SELECT 
    'ABC1234',
    c.id,
    'Toyota',
    'Corolla',
    2020,
    'Branco',
    '9BW12345678901234',
    '12345678901'
FROM public.clientes c
WHERE c.nome = 'João Silva'
LIMIT 1
ON CONFLICT (placa) DO NOTHING;

INSERT INTO public.veiculos (placa, cliente_id, marca, modelo, ano, cor, chassi, renavam)
SELECT 
    'XYZ5678',
    c.id,
    'Honda',
    'Civic',
    2021,
    'Preto',
    '9BW98765432109876',
    '98765432109'
FROM public.clientes c
WHERE c.nome = 'Maria Santos'
LIMIT 1
ON CONFLICT (placa) DO NOTHING;

INSERT INTO public.veiculos (placa, cliente_id, marca, modelo, ano, cor, chassi, renavam)
SELECT 
    'DEF9012',
    c.id,
    'Volkswagen',
    'Gol',
    2019,
    'Prata',
    '9BW55555555555555',
    '55555555555'
FROM public.clientes c
WHERE c.nome = 'Pedro Oliveira'
LIMIT 1
ON CONFLICT (placa) DO NOTHING;

INSERT INTO public.veiculos (placa, cliente_id, marca, modelo, ano, cor, chassi, renavam)
SELECT 
    'GHI3456',
    c.id,
    'Ford',
    'Ranger',
    2022,
    'Azul',
    '9BW11111111111111',
    '11111111111'
FROM public.clientes c
WHERE c.nome = 'Empresa ABC Ltda'
LIMIT 1
ON CONFLICT (placa) DO NOTHING;

-- ============================================
-- 3. INSERIR ENTRADAS DE EXEMPLO (Opcional)
-- ============================================
-- Descomente as linhas abaixo se quiser inserir entradas de exemplo

/*
INSERT INTO public.entradas (
    placa,
    marca,
    modelo,
    ano,
    cor,
    tipo_veiculo,
    quilometragem,
    tipo_servico,
    descricao_problema,
    status,
    cliente_id,
    veiculo_id
)
SELECT 
    v.placa,
    v.marca,
    v.modelo,
    v.ano,
    v.cor,
    'carro',
    50000,
    'Revisão',
    'Revisão periódica de 50.000 km',
    'aguardando',
    v.cliente_id,
    v.id
FROM public.veiculos v
WHERE v.placa = 'ABC1234'
LIMIT 1
ON CONFLICT (placa) DO NOTHING;
*/

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================
-- Execute estas queries para verificar se os dados foram inseridos corretamente:

-- SELECT COUNT(*) as total_clientes FROM public.clientes;
-- SELECT COUNT(*) as total_veiculos FROM public.veiculos;
-- SELECT COUNT(*) as total_entradas FROM public.entradas;

-- SELECT c.nome, c.telefone, v.placa, v.marca, v.modelo
-- FROM public.clientes c
-- LEFT JOIN public.veiculos v ON v.cliente_id = c.id
-- ORDER BY c.nome;

