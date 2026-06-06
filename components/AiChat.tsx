import { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { useChatMutation, ChatMessage } from "../lib/hooks/useChat";
import { useChatStore, ChatSession } from "../store/chat.store";

interface Household {
  id: number;
  name: string;
}

interface AiChatProps {
  year?: number;
  month?: number;
  householdId?: number;
  householdName?: string;
  households?: Household[];
}

export default function AiChat({
  year,
  month,
  householdId,
  householdName,
  households,
}: AiChatProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const chatMutation = useChatMutation();

  // Chat store
  const {
    sessions,
    activeSessionId,
    createSession,
    setActiveSession,
    addMessage,
    deleteSession,
  } = useChatStore();

  // Get active session's messages
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const messages: ChatMessage[] = activeSession?.messages ?? [];

  // Only show sessions that have at least one message in history
  const nonEmptySessions = useMemo(
    () => sessions.filter((s) => s.messages.length > 0),
    [sessions],
  );

  function ensureSession(): string {
    if (activeSessionId) return activeSessionId;
    return createSession(householdId);
  }

  function handleSend() {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const sessionId = ensureSession();
    const userMsg: ChatMessage = { role: "user", content: text };
    addMessage(sessionId, userMsg);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setInput("");

    setTimeout(() => inputRef.current?.focus(), 0);

    chatMutation.mutate(
      {
        message: text,
        history,
        year,
        month,
        householdId,
        householdName,
        households,
      },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: data.message,
          };
          addMessage(sessionId, assistantMsg);
          setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          };
          addMessage(sessionId, errorMsg);
        },
      },
    );

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleNewChat() {
    setActiveSession(null);
    setInput("");
  }

  function handleSelectSession(session: ChatSession) {
    setActiveSession(session.id);
    setHistoryOpen(false);
  }

  function handleDeleteSession(sessionId: string) {
    deleteSession(sessionId);
  }

  function formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Text className="text-white font-semibold text-sm flex-1">
          Ask Kevin AI...
        </Text>
        <Ionicons name="chevron-down" size={18} color="#fff" />
      </TouchableOpacity>
    );
  }

  // Expanded state
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl mb-4 shadow-sm overflow-hidden border border-primary-200 dark:border-primary-800">
      {/* Header */}
      <View
        className="bg-primary-600 px-4 py-3 flex-row items-center"
        style={{ gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setExpanded(false)}
          className="flex-row items-center flex-1"
          style={{ gap: 8 }}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm flex-1">
            Kevin AI Assistant
          </Text>
        </TouchableOpacity>

        {/* History dropdown button */}
        {nonEmptySessions.length > 0 && (
          <TouchableOpacity
            onPress={() => setHistoryOpen(true)}
            className="w-7 h-7 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Ionicons name="time-outline" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* New chat button — disabled when current chat is already empty */}
        <TouchableOpacity
          onPress={handleNewChat}
          disabled={messages.length === 0}
          className="w-7 h-7 items-center justify-center rounded-full"
          style={{
            backgroundColor:
              messages.length === 0
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.2)",
          }}
        >
          <Ionicons
            name="add"
            size={16}
            color={messages.length === 0 ? "rgba(255,255,255,0.4)" : "#fff"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Ionicons name="chevron-up" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="px-3 py-2"
        style={{ maxHeight: 280 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <Text className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">
            Ask me to add expenses, income, assets, or liabilities.{"\n"}
            e.g. "Add $50 groceries expense for this month"
          </Text>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            className={`mb-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <View
              className={`rounded-xl px-3 py-2 max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary-600"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {msg.role === "user" ? (
                <Text className="text-sm text-white">{msg.content}</Text>
              ) : (
                <Markdown
                  style={{
                    body: {
                      fontSize: 13,
                      color: isDark ? "#fff" : "#111827",
                      lineHeight: 20,
                    },
                    strong: {
                      fontWeight: "700",
                      color: isDark ? "#fff" : "#111827",
                    },
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-row items-center px-3 py-2 border-t border-gray-100 dark:border-gray-700"
          style={{ gap: 8 }}
        >
          <TextInput
            ref={inputRef}
            className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!chatMutation.isPending}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons
              name="send"
              size={20}
              color={input.trim() ? "#2563eb" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={historyOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setHistoryOpen(false)}
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="w-[85%] max-h-[60%] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                Chat History
              </Text>
              <TouchableOpacity onPress={() => setHistoryOpen(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "#fff" : "#374151"}
                />
              </TouchableOpacity>
            </View>

            {/* Session List */}
            <FlatList
              data={nonEmptySessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 4 }}
              ListEmptyComponent={
                <Text className="text-gray-400 text-sm text-center py-8">
                  No conversations yet
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSession(item)}
                  className={`flex-row items-center px-4 py-3 ${
                    item.id === activeSessionId
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : ""
                  }`}
                >
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text
                      className="text-sm font-medium text-gray-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                      {item.messages.length} messages ·{" "}
                      {formatDate(item.updatedAt)}
                    </Text>
                  </View>

                  {/* Delete button */}
                  <TouchableOpacity
                    onPress={() => handleDeleteSession(item.id)}
                    className="w-7 h-7 items-center justify-center ml-2"
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
