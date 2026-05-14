import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

// ─── Currency list ────────────────────────────────────────────────────────────

interface Currency {
  code: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: "AED", name: "UAE Dirham" },
  { code: "AFN", name: "Afghan Afghani" },
  { code: "ALL", name: "Albanian Lek" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "ANG", name: "Netherlands Antillean Guilder" },
  { code: "AOA", name: "Angolan Kwanza" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "AWG", name: "Aruban Florin" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark" },
  { code: "BBD", name: "Barbadian Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "BIF", name: "Burundian Franc" },
  { code: "BMD", name: "Bermudan Dollar" },
  { code: "BND", name: "Brunei Dollar" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BSD", name: "Bahamian Dollar" },
  { code: "BTN", name: "Bhutanese Ngultrum" },
  { code: "BWP", name: "Botswanan Pula" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "BZD", name: "Belize Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CDF", name: "Congolese Franc" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "CUP", name: "Cuban Peso" },
  { code: "CVE", name: "Cape Verdean Escudo" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DJF", name: "Djiboutian Franc" },
  { code: "DKK", name: "Danish Krone" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ERN", name: "Eritrean Nakfa" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "EUR", name: "Euro" },
  { code: "FJD", name: "Fijian Dollar" },
  { code: "FKP", name: "Falkland Islands Pound" },
  { code: "GBP", name: "British Pound Sterling" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "GIP", name: "Gibraltar Pound" },
  { code: "GMD", name: "Gambian Dalasi" },
  { code: "GNF", name: "Guinean Franc" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "GYD", name: "Guyanaese Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "HRK", name: "Croatian Kuna" },
  { code: "HTG", name: "Haitian Gourde" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "ILS", name: "Israeli New Shekel" },
  { code: "INR", name: "Indian Rupee" },
  { code: "IQD", name: "Iraqi Dinar" },
  { code: "IRR", name: "Iranian Rial" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "KGS", name: "Kyrgystani Som" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "KMF", name: "Comorian Franc" },
  { code: "KPW", name: "North Korean Won" },
  { code: "KRW", name: "South Korean Won" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "KYD", name: "Cayman Islands Dollar" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "LAK", name: "Laotian Kip" },
  { code: "LBP", name: "Lebanese Pound" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "LRD", name: "Liberian Dollar" },
  { code: "LSL", name: "Lesotho Loti" },
  { code: "LYD", name: "Libyan Dinar" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "MGA", name: "Malagasy Ariary" },
  { code: "MKD", name: "Macedonian Denar" },
  { code: "MMK", name: "Myanma Kyat" },
  { code: "MNT", name: "Mongolian Tugrik" },
  { code: "MOP", name: "Macanese Pataca" },
  { code: "MRU", name: "Mauritanian Ouguiya" },
  { code: "MUR", name: "Mauritian Rupee" },
  { code: "MVR", name: "Maldivian Rufiyaa" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "NAD", name: "Namibian Dollar" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "PGK", name: "Papua New Guinean Kina" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "PYG", name: "Paraguayan Guarani" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "SBD", name: "Solomon Islands Dollar" },
  { code: "SCR", name: "Seychellois Rupee" },
  { code: "SDG", name: "Sudanese Pound" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "SHP", name: "Saint Helena Pound" },
  { code: "SLL", name: "Sierra Leonean Leone" },
  { code: "SOS", name: "Somali Shilling" },
  { code: "SRD", name: "Surinamese Dollar" },
  { code: "STN", name: "São Tomé & Príncipe Dobra" },
  { code: "SYP", name: "Syrian Pound" },
  { code: "SZL", name: "Swazi Lilangeni" },
  { code: "THB", name: "Thai Baht" },
  { code: "TJS", name: "Tajikistani Somoni" },
  { code: "TMT", name: "Turkmenistani Manat" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "TOP", name: "Tongan Paʻanga" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TTD", name: "Trinidad & Tobago Dollar" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "UZS", name: "Uzbekistani Som" },
  { code: "VES", name: "Venezuelan Bolívar" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "VUV", name: "Vanuatu Vatu" },
  { code: "WST", name: "Samoan Tala" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "XCD", name: "East Caribbean Dollar" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "XPF", name: "CFP Franc" },
  { code: "YER", name: "Yemeni Rial" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ZMW", name: "Zambian Kwacha" },
  { code: "ZWL", name: "Zimbabwean Dollar" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
}

export default function CurrencyPicker({
  value,
  onChange,
  label = "Currency",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Position of the popover
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [search]);

  const selected = CURRENCIES.find((c) => c.code === value);

  function handleOpen() {
    triggerRef.current?.measure(
      (
        _x: number,
        _y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => {
        const screenWidth = Dimensions.get("window").width;
        setPopoverPos({
          top: pageY + height + 6,
          right: screenWidth - pageX - width,
        });
        setOpen(true);
      },
    );
  }

  function handleSelect(code: string) {
    onChange(code);
    setSearch("");
    setOpen(false);
  }

  function handleClose() {
    setSearch("");
    setOpen(false);
  }

  return (
    <>
      {/* ── Trigger row ────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between py-2 mb-2">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Text>
        <TouchableOpacity
          ref={triggerRef}
          className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5"
          onPress={handleOpen}
          activeOpacity={0.7}
        >
          <Text className="text-gray-900 dark:text-white font-semibold text-sm">
            {selected?.code ?? value}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={isDark ? "#9ca3af" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {/* ── Popover dropdown ───────────────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {/* Invisible full-screen tap-to-close layer */}
        <Pressable className="flex-1" onPress={handleClose}>
          {/* Popover panel */}
          <Pressable
            onPress={() => {}}
            style={{
              position: "absolute",
              top: popoverPos.top,
              right: popoverPos.right,
              width: 260,
              borderRadius: 12,
              backgroundColor: isDark ? "#111827" : "#ffffff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.4 : 0.12,
              shadowRadius: 16,
              elevation: 10,
              overflow: "hidden",
            }}
          >
            {/* Search bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                margin: 8,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
              }}
            >
              <Ionicons
                name="search"
                size={14}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 6,
                  fontSize: 13,
                  color: isDark ? "#f9fafb" : "#111827",
                }}
                placeholder="Search…"
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="characters"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                marginHorizontal: 0,
              }}
            />

            {/* Currency list */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              style={{ maxHeight: 280 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => {
                const isSelected = item.code === value;
                const isLast = index === filtered.length - 1;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.code)}
                    activeOpacity={0.6}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      backgroundColor: isSelected
                        ? isDark
                          ? "#1e3a5f"
                          : "#eff6ff"
                        : "transparent",
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: isDark ? "#1f2937" : "#f3f4f6",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? "700" : "600",
                          color: isSelected
                            ? "#2563eb"
                            : isDark
                              ? "#f9fafb"
                              : "#111827",
                        }}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isDark ? "#9ca3af" : "#6b7280",
                          marginTop: 1,
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={15} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
