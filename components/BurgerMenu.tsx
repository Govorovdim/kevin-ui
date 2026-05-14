import SideMenu from "./SideMenu";
import { useHouseholdStore } from "../store/household.store";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BurgerMenu({ visible, onClose }: Props) {
  const { activeHousehold, setActiveHousehold } = useHouseholdStore();

  return (
    <SideMenu
      visible={visible}
      onClose={onClose}
      onSelectHousehold={(h) => {
        setActiveHousehold(h);
        onClose();
      }}
      showExportImport
      activeHousehold={activeHousehold}
    />
  );
}
