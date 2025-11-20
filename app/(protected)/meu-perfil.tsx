import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ChatModal } from "../../components/chat-modal";
import { supabase } from "../../lib/supabase";
import { chatService, type Conversation } from "../../services/chat.service";

const ITEMS_PER_PAGE = 20;

// Função para formatar data no estilo WhatsApp
function formatDate(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Hoje - mostrar apenas a hora
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    // Ontem
    return "Ontem";
  } else if (diffDays < 7) {
    // Esta semana - mostrar dia da semana
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  } else {
    // Mais antigo - mostrar data completa
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }
}

// Função para obter iniciais do nome/email
function getInitials(email: string): string {
  const parts = email.split("@")[0].split(".");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export default function MeuPerfilScreen() {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: async ({ pageParam = 1 }) => {
      console.log("🔍 Buscando conversas, página:", pageParam);
      const result = await chatService.getConversations(
        pageParam,
        ITEMS_PER_PAGE
      );
      console.log("📦 Resultado da busca:", {
        success: result.success,
        error: result.error,
        dataLength: result.data?.length || 0,
      });
      if (!result.success) {
        console.error("❌ Erro ao buscar conversas:", result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página tiver menos itens que o limite, não há mais páginas
      if (lastPage.length < ITEMS_PER_PAGE) {
        return undefined;
      }
      // Retorna o próximo número de página
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  // Flatten dos dados de todas as páginas
  const conversations = data?.pages.flat() || [];

  // Subscription Realtime para atualizar conversas em tempo real
  useEffect(() => {
    console.log("🔔 Iniciando subscription Realtime para conversas");

    // Escutar mudanças na tabela conversations
    const conversationsChannel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("🔄 Conversa atualizada via Realtime:", payload);
          // Invalidar query para atualizar a lista
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe((status) => {
        console.log("📡 Status da subscription de conversas:", status);
      });

    // Escutar novas mensagens para atualizar last_message nas conversas
    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log(
            "📨 Nova mensagem detectada (atualizar conversas):",
            payload.new
          );
          // Invalidar query para atualizar last_message nas conversas
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe((status) => {
        console.log("📡 Status da subscription de mensagens:", status);
      });

    // Cleanup: remover subscriptions quando o componente desmontar
    return () => {
      console.log("🔕 Removendo subscriptions Realtime");
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [queryClient]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const hasUnread = !item.last_message_is_mine && item.last_message_at;
    const displayName = item.other_participant_email.split("@")[0];
    const initials = getInitials(item.other_participant_email);
    const formattedDate = formatDate(item.last_message_at);

    return (
      <Pressable
        className="bg-white active:bg-gray-50"
        onPress={() => {
          setSelectedConversation({
            id: item.conversation_id,
            email: item.other_participant_email,
          });
        }}
      >
        <View className="flex-row px-4 py-3 border-b border-gray-100">
          {/* Avatar circular com iniciais */}
          <View className="w-14 h-14 rounded-full bg-green-500 items-center justify-center mr-3">
            <Text className="text-white text-lg font-semibold">{initials}</Text>
          </View>

          {/* Informações da conversa */}
          <View className="flex-1 justify-center">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-base font-semibold text-gray-900"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {formattedDate && (
                <Text className="text-xs text-gray-500 ml-2">
                  {formattedDate}
                </Text>
              )}
            </View>

            <View className="flex-row items-center">
              <Text className="flex-1 text-sm text-gray-600" numberOfLines={1}>
                {item.last_message_text || "Nenhuma mensagem"}
              </Text>
              {hasUnread && (
                <View className="w-2 h-2 rounded-full bg-green-500 ml-2" />
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#22c55e" />
        <Text className="text-gray-600 mt-2 text-xs">Carregando mais...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-lg font-semibold text-gray-700">
          Nenhuma conversa ainda
        </Text>
        <Text className="text-sm text-gray-500 mt-2 text-center px-8">
          Suas conversas aparecerão aqui
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-600 mt-4">Carregando conversas...</Text>
      </View>
    );
  }

  if (isError) {
    console.error("🚨 Erro no useInfiniteQuery:", error);
    console.error("🚨 Detalhes do erro:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-xl font-bold text-red-500 text-center">
          Erro ao carregar conversas
        </Text>
        <Text className="mt-4 text-gray-600 text-center">
          Verifique sua conexão e tente novamente
        </Text>
        <Text className="mt-2 text-xs text-gray-400 text-center">
          {error?.message || "Erro desconhecido"}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header estilo WhatsApp */}
      <View className="bg-green-500 px-4 py-3 pt-12">
        <Text className="text-xl font-semibold text-white">Conversas</Text>
      </View>

      {/* Lista de conversas */}
      <FlashList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.conversation_id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modal do Chat */}
      <ChatModal
        visible={!!selectedConversation}
        conversationId={selectedConversation?.id || null}
        otherParticipantEmail={selectedConversation?.email || ""}
        onClose={() => setSelectedConversation(null)}
      />
    </View>
  );
}
