import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Linking from "expo-linking";
import { useGenerateInvite } from "../lib/hooks/useHouseholds";

interface Props {
  visible: boolean;
  onClose: () => void;
  householdId: number;
  householdName: string;
}

export default function HouseholdInviteModal({
  visible,
  onClose,
  householdId,
  householdName,
}: Props) {
  const generateInvite = useGenerateInvite();
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // Generate token when the modal opens
  useEffect(() => {
    if (visible) {
      setInviteToken(null);
      generateInvite.mutate(householdId, {
        onSuccess: (household) => {
          setInviteToken(household.invite_token);
        },
      });
    }
  }, [visible, householdId]);

  // Build the correct deep-link URL for the current runtime.
  //
  // Priority:
  //  1. EXPO_PUBLIC_APP_URL env var (e.g. "http://192.168.50.2:8081") —
  //     set this in kevin-ui/.env for LAN development. On native we
  //     convert it to the exp:// scheme that Expo Go understands.
  //  2. Linking.createURL() — works correctly for production builds and
  //     when Expo is started with --host lan.
  const appUrl = process.env.EXPO_PUBLIC_APP_URL; // e.g. "http://192.168.50.2:8081"
  const joinUrl = inviteToken
    ? appUrl
      ? Platform.OS === "web"
        ? `${appUrl.replace(/\/$/, "")}/join/${inviteToken}`
        : `exp://${appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/--/join/${inviteToken}`
      : Linking.createURL(`join/${inviteToken}`)
    : null;

  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (!joinUrl) return;

    if (Platform.OS === "web") {
      // Try the browser's native Web Share API first, fall back to clipboard
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: `Join ${householdName} on Kevin`,
            text: "Join my household in Kevin!",
            url: joinUrl,
          });
          return;
        } catch (_) {
          // user cancelled or API unavailable — fall through to clipboard
        }
      }
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {}
      return;
    }

    // Native
    await Share.share({ message: `Join my household in Kevin!\n${joinUrl}` });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm items-center">
          {/* Title */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Invite to {householdName}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
            Have someone scan this QR code to join your household
          </Text>

          {/* QR Code or loading */}
          {generateInvite.isPending || !inviteToken ? (
            <View className="w-48 h-48 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <View className="p-3 bg-white rounded-xl">
              <QRCode value={joinUrl!} size={192} />
            </View>
          )}

          {/* Token text */}
          {inviteToken && (
            <Text className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center font-mono">
              {inviteToken}
            </Text>
          )}

          {/* Buttons */}
          <View className="flex-row mt-6 gap-3 w-full">
            {inviteToken && (
              <TouchableOpacity
                className="flex-1 bg-primary-600 rounded-xl py-3 items-center"
                onPress={handleShare}
                activeOpacity={0.75}
              >
                <Text className="text-white font-semibold text-sm">
                  {copied ? "Copied!" : "Share"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-3 items-center"
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text className="text-gray-600 dark:text-gray-400 text-sm">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
