import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { Image } from "expo-image";
import { ActivityIndicator, Text, View } from "react-native";

const MOCKAPI_URL = "https://675877bf60576a194d10a71b.mockapi.io/api/v1/users";
const ITEMS_PER_PAGE = 10;

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  city: string;
  state: string;
  role: string;
  cpfCnpj: string;
  createdAt: string;
}

export default function CheckoutScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["check-out"],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await axios.get(
          `${MOCKAPI_URL}?page=${pageParam}&limit=${ITEMS_PER_PAGE}`
        );
        return response.data;
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página tiver menos itens que o limite, não há mais páginas
      if (Array.isArray(lastPage) && lastPage.length < ITEMS_PER_PAGE) {
        return undefined;
      }
      // Retorna o próximo número de página
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  // Flatten dos dados de todas as páginas
  const items = data?.pages.flat() || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: User }) => {
    return (
      <View className="bg-white mb-4 mx-4 rounded-lg shadow-md overflow-hidden">
        <View className="flex-row p-4">
          {/* Avatar */}
          <Image
            source={{ uri: item.avatar }}
            className="w-16 h-16 rounded-full"
            contentFit="cover"
          />

          {/* Informações */}
          <View className="flex-1 ml-4 justify-center">
            <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
            <Text className="text-sm text-gray-600 mt-1">{item.role}</Text>
            <Text className="text-xs text-gray-500 mt-1">{item.email}</Text>
            <View className="flex-row mt-2">
              <Text className="text-xs text-gray-500">
                {item.city}, {item.state}
              </Text>
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
        <ActivityIndicator size="small" color="#84cc16" />
        <Text className="text-gray-600 mt-2">Carregando mais...</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#84cc16" />
        <Text className="text-gray-600 mt-4">Carregando dados...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-red-500">
          Erro ao carregar dados
        </Text>
        <Text className="mt-4 text-gray-600">
          Verifique sua conexão e tente novamente
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <View className="items-center py-4 bg-white">
        <Text className="text-2xl font-bold">Tela do Check-Out</Text>
        <Text className="mt-2 text-gray-600">
          {items.length} {items.length === 1 ? "item" : "itens"} carregados
        </Text>
      </View>
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
      />
    </View>
  );
}
