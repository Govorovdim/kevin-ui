import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { useChatMutation, ChatMessage, ActionResult } from "../lib/hooks/useChat";

interface Household {
  id: number;
  name: string;
}

interface AiChatProps {
  year?: number;
  month?: number;
  householdName?: string;
  households?: Household[];
}

export default function AiChat({ year, month, householdName, households }: AiChatProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<(ChatMessage & { actions?: ActionResult[] })[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const chatMutation = useChatMutation();

  function handleSend() {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    chatMutation.mutate(
      { message: text, history, year, month, householdName, households },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage & { actions?: ActionResult[] } = {
            role: "assistant",
            content: data.message,
            actions: data.actions,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      },
    );

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // Collapsed state — just a button bar
  if (!expanded) {
    return (
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        className="bg-primary-600 rounded-2xl px-4 py-3 mb-4 flex-row items-center"
        style={{ gap: 8 }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
        <Text className="text-white font-semibold text-sm flex-1">Ask Kevin AI...</Text>
        <Ionicons name="chevron-down" size={18} color="#fff" />
      </TouchableOpacity>
    );
  }

  // Expanded state
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl mb-4 shadow-sm overflow-hidden border border-primary-200 dark:border-primary-800">
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded(false)}
        className="bg-primary-600 px-4 py-3 flex-row items-center"
        style={{ gap: 8 }}
      >
        <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
        <Text className="text-white font-semibold text-sm flex-1">Kevin AI Assistant</Text>
        <Ionicons name="chevron-up" size={18} color="#fff" />
      </TouchableOpacity>

      {/* Messages */}
      <ScrollView ref={scrollRef} className="px-3 py-2" style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
        {messages.length === 0 && (
          <Text className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">
            Ask me to add expenses, income, assets, or liabilities.{"\n"}
            e.g. "Add $50 groceries expense for this month"
          </Text>
        )}

        {messages.map((msg, i) => (
          <View key={i} className={`mb-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <View
              className={`rounded-xl px-3 py-2 max-w-[85%] ${
                msg.role === "user" ? "bg-primary-600" : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {msg.role === "user" ? (
                <Text className="text-sm text-white">{msg.content}</Text>
              ) : (
                <Markdown
                  style={{
                    body: { fontSize: 13, color: isDark ? "#fff" : "#111827", lineHeight: 20 },
                    strong: { fontWeight: "700", color: isDark ? "#fff" : "#111827" },
                    bullet_list: { marginVertical: 4 },
                    ordered_list: { marginVertical: 4 },
                    list_item: { marginVertical: 2 },
                    paragraph: { marginVertical: 2 },
                    heading3: {
                      fontSize: 14,
                      fontWeight: "700",
                      color: isDark ? "#fff" : "#111827",
                      marginVertical: 4,
                    },
                    heading2: {
                      fontSize: 15,
                      fontWeight: "700",
                      color: isDark ? "#fff" : "#111827",
                      marginVertical: 4,
                    },
                    code_inline: {
                      backgroundColor: isDark ? "#374151" : "#e5e7eb",
                      borderRadius: 4,
                      paddingHorizontal: 4,
                      fontSize: 12,
                    },
                  }}
                >
                  {msg.content}
                </Markdown>
              )}
            </View>
          </View>
        ))}

        {chatMutation.isPending && (
          <View className="items-start mb-2">
            <View className="bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          className="flex-row items-center px-3 py-2 border-t border-gray-100 dark:border-gray-700"
          style={{ gap: 8 }}
        >
          <TextInput
            className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!chatMutation.isPending}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="send" size={20} color={input.trim() ? "#2563eb" : "#9ca3af"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
