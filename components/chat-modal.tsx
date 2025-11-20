import Feather from "@expo/vector-icons/Feather";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { chatService, type Message } from "../services/chat.service";

interface ChatModalProps {
  visible: boolean;
  conversationId: string | null;
  otherParticipantEmail: string;
  onClose: () => void;
}

const MESSAGES_PER_PAGE = 50;

// Função para formatar data/hora das mensagens
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Função para verificar se é do mesmo dia
function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Função para formatar data de separador
function formatSeparatorDate(dateString: string): string {
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
    return "Hoje";
  } else if (diffDays === 1) {
    return "Ontem";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "long" });
  } else {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
}

export function ChatModal({
  visible,
  conversationId,
  otherParticipantEmail,
  onClose,
}: ChatModalProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  // Obter ID do usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!conversationId) return [];
      const result = await chatService.getMessages(
        conversationId,
        pageParam,
        MESSAGES_PER_PAGE
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: visible && !!conversationId,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < MESSAGES_PER_PAGE) {
        return undefined;
      }
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  // Marcar mensagens como lidas quando abrir o chat
  useEffect(() => {
    if (visible && conversationId) {
      chatService.markMessagesAsRead(conversationId);
    }
  }, [visible, conversationId]);

  // Subscription para novas mensagens em tempo real
  useEffect(() => {
    if (!visible || !conversationId) return;

    console.log("🔔 Iniciando subscription Realtime para mensagens");

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("📨 Nova mensagem recebida via Realtime:", payload.new);
          // Invalidar query para atualizar a lista
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
          // Se a mensagem não for minha, marcar como lida
          if (payload.new.sender_id !== currentUserId) {
            chatService.markMessagesAsRead(conversationId);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("🔄 Mensagem atualizada via Realtime:", payload.new);
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 Status da subscription:", status);
      });

    // Cleanup: remover subscription quando o modal fechar
    return () => {
      console.log("🔕 Removendo subscription Realtime");
      supabase.removeChannel(channel);
    };
  }, [visible, conversationId, currentUserId, queryClient]);

  const messages = data?.pages.flat() || [];
  const displayName = otherParticipantEmail.split("@")[0];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleSendMessage = async () => {
    if (!conversationId || !messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      const result = await chatService.sendMessage(
        conversationId,
        messageText.trim()
      );

      if (result.success) {
        // Limpar input
        setMessageText("");
        // Invalidar queries para atualizar a lista de mensagens e conversas
        queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        // Refetch para atualizar imediatamente
        refetch();
      } else {
        console.error("Erro ao enviar mensagem:", result.error);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === currentUserId;
    const showSeparator =
      index === 0 ||
      !isSameDay(item.created_at, messages[index - 1]?.created_at || "");

    return (
      <View>
        {showSeparator && (
          <View className="items-center my-4">
            <Text className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {formatSeparatorDate(item.created_at)}
            </Text>
          </View>
        )}

        <View
          className={`flex-row mb-2 px-4 ${
            isMyMessage ? "justify-end" : "justify-start"
          }`}
        >
          <View
            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
              isMyMessage
                ? "bg-green-500 rounded-br-sm"
                : "bg-gray-200 rounded-bl-sm"
            }`}
          >
            <Text
              className={`text-base ${
                isMyMessage ? "text-white" : "text-gray-900"
              }`}
            >
              {item.content}
            </Text>
            <View className="flex-row items-center justify-end mt-1">
              <Text
                className={`text-xs ${
                  isMyMessage ? "text-green-100" : "text-gray-500"
                }`}
              >
                {formatMessageTime(item.created_at)}
              </Text>
              {isMyMessage && (
                <View className="ml-1">
                  {item.is_read ? (
                    <Feather
                      name="check"
                      size={14}
                      color="#a7f3d0"
                      style={{ marginLeft: 2 }}
                    />
                  ) : (
                    <Feather
                      name="check"
                      size={14}
                      color="#a7f3d0"
                      style={{ opacity: 0.5 }}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#22c55e" />
      </View>
    );
  };

  if (!conversationId) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View className="bg-green-500 px-4 py-3 pt-12 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={onClose}
              className="mr-3"
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
              <Text className="text-white font-semibold">
                {displayName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-white text-lg font-semibold"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text className="text-green-100 text-xs">
                {otherParticipantEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* Lista de mensagens */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22c55e" />
            <Text className="text-gray-600 mt-4">Carregando mensagens...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-lg font-bold text-red-500 text-center">
              Erro ao carregar mensagens
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 bg-green-500 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          />
        )}

        {/* Footer com input e botão de envio */}
        <View className="border-t border-gray-200 bg-white px-4 py-3">
          <View className="flex-row items-end">
            <View className="flex-1 mr-3">
              <TextInput
                className="bg-gray-100 rounded-full px-4 py-3 text-base text-gray-900 max-h-24"
                placeholder="Digite uma mensagem..."
                placeholderTextColor="#9ca3af"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                textAlignVertical="center"
                editable={!isSending}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                messageText.trim() && !isSending
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather
                  name="send"
                  size={20}
                  color={messageText.trim() ? "#FFFFFF" : "#9ca3af"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
