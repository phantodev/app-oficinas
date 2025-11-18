import { supabase } from "../lib/supabase";

// Tipo para os dados do cliente retornados na busca
export interface ClienteData {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

// Tipo para os dados do veículo retornados na busca
export interface VehicleData {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  cliente_id: string;
  cliente?: ClienteData;
  outraPessoaEntregando?: boolean;
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
}

/**
 * Serviço para operações relacionadas a veículos
 */
export const vehicleService = {
  /**
   * Busca um veículo pela placa e retorna os dados do veículo e do cliente associado
   * @param placa - Placa do veículo (sem máscara, apenas letras e números)
   * @returns Promise com o resultado da busca contendo veículo e cliente
   */
  async findByPlaca(placa: string) {
    try {
      // Remove espaços e converte para maiúsculo
      const placaNormalizada = placa.trim().toUpperCase();

      if (!placaNormalizada) {
        return {
          success: false,
          error: "Placa é obrigatória",
          vehicle: null,
        };
      }

      // Busca o veículo pela placa e faz join com a tabela de clientes
      const { data: vehicle, error } = await supabase
        .from("veiculos")
        .select(
          `
          *,
          clientes (
            id,
            nome,
            telefone,
            email,
            endereco
          )
        `
        )
        .eq("placa", placaNormalizada)
        .single();

      if (error) {
        // Se não encontrou nenhum registro, retorna erro específico
        if (error.code === "PGRST116") {
          return {
            success: false,
            error: "Veículo não encontrado",
            vehicle: null,
          };
        }
        throw error;
      }

      // Formata os dados do cliente
      const clienteData: ClienteData | undefined = vehicle.clientes
        ? {
            id: vehicle.clientes.id,
            nome: vehicle.clientes.nome,
            telefone: vehicle.clientes.telefone || "",
            email: vehicle.clientes.email || "",
            endereco: vehicle.clientes.endereco || "",
          }
        : undefined;

      // Formata os dados do veículo
      const vehicleData: VehicleData = {
        id: vehicle.id,
        placa: vehicle.placa,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        ano: vehicle.ano,
        cor: vehicle.cor,
        cliente_id: vehicle.cliente_id,
        cliente: clienteData,
      };

      return {
        success: true,
        vehicle: vehicleData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar veículo",
        vehicle: null,
      };
    }
  },
};
