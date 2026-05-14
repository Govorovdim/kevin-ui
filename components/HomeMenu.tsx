import { useRouter } from "expo-router";
import SideMenu from "./SideMenu";
import { useHouseholdStore } from "../store/household.store";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeMenu({ visible, onClose }: Props) {
  const router = useRouter();
  const { setActiveHousehold } = useHouseholdStore();

  return (
    <SideMenu
      visible={visible}
      onClose={onClose}
      onSelectHousehold={(h) => {
        setActiveHousehold(h);
        onClose();
        router.push("/(tabs)");
      }}
    />
  );
}
