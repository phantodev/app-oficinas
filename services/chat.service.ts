import { supabase } from "../lib/supabase";

// Tipo para uma conversa com informações do outro participante
export interface Conversation {
  conversation_id: string;
  last_message_at: string | null;
  last_message_text: string | null;
  last_message_sender_id: string | null;
  created_at: string;
  updated_at: string;
  other_participant_id: string;
  other_participant_email: string;
  last_message_is_mine: boolean;
}

// Tipo para uma mensagem
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
}

/**
 * Serviço para operações relacionadas ao chat
 */
export const chatService = {
  /**
   * Busca as conversas do usuário autenticado
   * @param page - Número da página (para paginação)
   * @param limit - Limite de itens por página
   * @returns Promise com as conversas
   */
  async getConversations(page: number = 1, limit: number = 20) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("conversations_with_participant")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: (data || []) as Conversation[],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar conversas",
        data: [] as Conversation[],
      };
    }
  },

  /**
   * Busca as mensagens de uma conversa
   * @param conversationId - ID da conversa
   * @param page - Número da página (para paginação)
   * @param limit - Limite de itens por página
   * @returns Promise com as mensagens
   */
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Buscar mensagens
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (messagesError) {
        throw messagesError;
      }

      // Buscar o usuário atual para verificar quais mensagens foram lidas
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar leituras das mensagens
      const messageIds = (messages || []).map((m) => m.id);
      const { data: reads } = await supabase
        .from("message_reads")
        .select("message_id")
        .in("message_id", messageIds)
        .eq("reader_id", user.id);

      const readMessageIds = new Set(
        (reads || []).map((r) => r.message_id)
      );

      // Combinar mensagens com status de leitura
      const messagesWithReadStatus: Message[] = (messages || []).map(
        (msg) => ({
          ...msg,
          is_read: readMessageIds.has(msg.id),
        })
      );

      // Reverter para ordem cronológica (mais antiga primeiro)
      messagesWithReadStatus.reverse();

      return {
        success: true,
        data: messagesWithReadStatus,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar mensagens",
        data: [] as Message[],
      };
    }
  },

  /**
   * Envia uma mensagem
   * @param conversationId - ID da conversa
   * @param content - Conteúdo da mensagem
   * @returns Promise com a mensagem criada
   */
  async sendMessage(conversationId: string, content: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as Message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao enviar mensagem",
        data: null,
      };
    }
  },

  /**
   * Marca mensagens como lidas
   * @param conversationId - ID da conversa
   * @returns Promise com o número de mensagens marcadas como lidas
   */
  async markMessagesAsRead(conversationId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Usar a função do banco de dados
      const { data, error } = await supabase.rpc("mark_messages_as_read", {
        p_conversation_id: conversationId,
        p_reader_id: user.id,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        count: data || 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao marcar mensagens como lidas",
        count: 0,
      };
    }
  },

  /**
   * Obtém ou cria uma conversa entre dois usuários
   * @param otherUserId - ID do outro usuário
   * @returns Promise com o ID da conversa
   */
  async getOrCreateConversation(otherUserId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Usar a função do banco de dados
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        p_user1_id: user.id,
        p_user2_id: otherUserId,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        conversationId: data as string,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao obter/criar conversa",
        conversationId: null,
      };
    }
  },
};

