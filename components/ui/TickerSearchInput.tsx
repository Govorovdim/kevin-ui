import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { api } from "../../lib/api";

interface TickerResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface TickerSearchInputProps {
  value: string;
  onChange: (symbol: string, price: number | null) => void;
  placeholder?: string;
}

// ─── Popular metals & commodities ────────────────────────────────────────────
// Shown immediately when the input is focused with an empty query.
// Symbols are Yahoo Finance futures codes; prices are already per-unit
// (troy oz for metals, barrel for oil, etc.).

const POPULAR_ITEMS: TickerResult[] = [
  { symbol: "BTC-USD", name: "Bitcoin", type: "CRYPTO", exchange: "per BTC" },
  { symbol: "GC=F", name: "Gold", type: "METAL", exchange: "per troy oz" },
  { symbol: "SI=F", name: "Silver", type: "METAL", exchange: "per troy oz" },
  { symbol: "PL=F", name: "Platinum", type: "METAL", exchange: "per troy oz" },
  { symbol: "PA=F", name: "Palladium", type: "METAL", exchange: "per troy oz" },
  { symbol: "HG=F", name: "Copper", type: "METAL", exchange: "per lb" },
  {
    symbol: "CL=F",
    name: "Crude Oil (WTI)",
    type: "COMMODITY",
    exchange: "per barrel",
  },
  {
    symbol: "BZ=F",
    name: "Crude Oil (Brent)",
    type: "COMMODITY",
    exchange: "per barrel",
  },
  {
    symbol: "NG=F",
    name: "Natural Gas",
    type: "COMMODITY",
    exchange: "per mmbtu",
  },
];

// Badge color per type so metals/commodities stand out from stocks
const BADGE: Record<
  string,
  { bg: { light: string; dark: string }; text: { light: string; dark: string } }
> = {
  METAL: {
    bg: { light: "#fef3c7", dark: "#451a03" },
    text: { light: "#92400e", dark: "#fcd34d" },
  },
  COMMODITY: {
    bg: { light: "#d1fae5", dark: "#022c22" },
    text: { light: "#065f46", dark: "#6ee7b7" },
  },
  EQUITY: {
    bg: { light: "#eff6ff", dark: "#1e3a5f" },
    text: { light: "#2563eb", dark: "#93c5fd" },
  },
  ETF: {
    bg: { light: "#ede9fe", dark: "#2e1065" },
    text: { light: "#5b21b6", dark: "#c4b5fd" },
  },
  CRYPTO: {
    bg: { light: "#fff7ed", dark: "#431407" },
    text: { light: "#c2410c", dark: "#fb923c" },
  },
};
const DEFAULT_BADGE = {
  bg: { light: "#f3f4f6", dark: "#374151" },
  text: { light: "#374151", dark: "#d1d5db" },
};

function getBadgeColors(type: string, dark: boolean) {
  const entry = BADGE[type] ?? DEFAULT_BADGE;
  return {
    bg: dark ? entry.bg.dark : entry.bg.light,
    text: dark ? entry.text.dark : entry.text.light,
  };
}

// ─── Theme palette ────────────────────────────────────────────────────────────

const COLORS = {
  light: {
    cardBg: "#ffffff",
    inputBg: "#ffffff",
    border: "#e5e7eb",
    borderFocus: "#2563eb",
    text: "#111827",
    textMuted: "#6b7280",
    placeholder: "#9ca3af",
    separator: "#f3f4f6",
    sectionBg: "#f9fafb",
    sectionText: "#9ca3af",
    iconFocus: "#2563eb",
    iconIdle: "#9ca3af",
  },
  dark: {
    cardBg: "#1f2937",
    inputBg: "#374151",
    border: "#4b5563",
    borderFocus: "#3b82f6",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    placeholder: "#6b7280",
    separator: "#374151",
    sectionBg: "#111827",
    sectionText: "#6b7280",
    iconFocus: "#3b82f6",
    iconIdle: "#6b7280",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function TickerSearchInput({
  value,
  onChange,
  placeholder = "Search ticker or tap a metal below…",
}: TickerSearchInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? COLORS.dark : COLORS.light;

  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TickerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value → query when dropdown is closed (handles modal re-open)
  useEffect(() => {
    if (!open) setQuery(value);
  }, [value]);

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setOpen(true);
  };

  const handleBlur = () => {
    // Small delay so a tap on a result registers before we close
    blurTimerRef.current = setTimeout(() => setOpen(false), 200);
  };

  const runSearch = (text: string) => {
    setQuery(text);
    setSearchError(false);

    if (!text.trim()) {
      setResults([]);
      // Stay open to show the popular items list
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get<TickerResult[]>("/api/v1/tickers/search", {
          params: { q: text.trim() },
        });
        setResults(res.data ?? []);
      } catch {
        setResults([]);
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelect = async (item: TickerResult) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setQuery(item.symbol);
    setOpen(false);
    setResults([]);
    setFetchingPrice(true);
    try {
      const res = await api.get<{
        symbol: string;
        price: number | null;
        currency: string;
      }>(`/api/v1/tickers/${encodeURIComponent(item.symbol)}/quote`);
      onChange(item.symbol, res.data.price ?? null);
    } catch {
      onChange(item.symbol, null);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearchError(false);
    onChange("", null);
    // Keep open to show popular items again
  };

  // ── Helpers for rendering rows ─────────────────────────────────────────────

  const renderRow = (item: TickerResult, idx: number, isLast: boolean) => {
    const badge = getBadgeColors(item.type, isDark);
    return (
      <TouchableOpacity
        key={item.symbol}
        onPress={() => handleSelect(item)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 11,
          borderTopWidth: idx === 0 ? 0 : 1,
          borderTopColor: c.separator,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 14, color: c.text }}>
            {item.name || item.symbol}
          </Text>
          <Text
            style={{ fontSize: 12, color: c.textMuted, marginTop: 1 }}
            numberOfLines={1}
          >
            {item.symbol}
            {item.exchange ? `  ·  ${item.exchange}` : ""}
          </Text>
        </View>
        {item.type ? (
          <View
            style={{
              backgroundColor: badge.bg,
              borderRadius: 6,
              paddingHorizontal: 7,
              paddingVertical: 2,
              marginLeft: 8,
            }}
          >
            <Text
              style={{ color: badge.text, fontSize: 11, fontWeight: "600" }}
            >
              {item.type}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (label: string) => (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 4,
        backgroundColor: c.sectionBg,
        borderBottomWidth: 1,
        borderBottomColor: c.separator,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: c.sectionText,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );

  // ── Dropdown content ───────────────────────────────────────────────────────

  const renderDropdownContent = () => {
    // 1. Actively searching
    if (searching) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator color={c.textMuted} />
          <Text style={{ color: c.textMuted, marginTop: 6, fontSize: 13 }}>
            Searching…
          </Text>
        </View>
      );
    }

    // 2. API error
    if (searchError) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Ionicons name="warning-outline" size={22} color="#f59e0b" />
          <Text
            style={{
              color: c.textMuted,
              marginTop: 6,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Could not reach market data.{"\n"}Type the ticker manually.
          </Text>
        </View>
      );
    }

    // 3. No query typed → show popular metals & commodities
    if (!query.trim()) {
      return (
        <>
          {renderSectionHeader("Metals & Commodities")}
          {POPULAR_ITEMS.map((item, idx) =>
            renderRow(item, idx, idx === POPULAR_ITEMS.length - 1),
          )}
        </>
      );
    }

    // 4. Query typed but no results
    if (results.length === 0) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: c.placeholder, fontSize: 13 }}>
            No results found
          </Text>
        </View>
      );
    }

    // 5. Search results
    return (
      <>
        {renderSectionHeader("Results")}
        {results.map((item, idx) =>
          renderRow(item, idx, idx === results.length - 1),
        )}
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Input row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: open ? c.borderFocus : c.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: c.inputBg,
        }}
      >
        <Ionicons
          name="search-outline"
          size={16}
          color={open ? c.iconFocus : c.iconIdle}
          style={{ marginRight: 6 }}
        />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: c.text }}
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          autoCapitalize="characters"
          autoCorrect={false}
          value={query}
          onChangeText={runSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {searching || fetchingPrice ? (
          <ActivityIndicator size="small" color={c.iconIdle} />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={c.placeholder} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Inline dropdown */}
      {open && (
        <View
          style={{
            marginTop: 4,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            backgroundColor: c.cardBg,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {renderDropdownContent()}
        </View>
      )}
    </View>
  );
}
