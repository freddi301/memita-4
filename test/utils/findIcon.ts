import { FontAwesome } from "@expo/vector-icons";
import { render } from "@testing-library/react-native";
import { Icon } from "../../components/ui/Icon";

type IconName = keyof typeof FontAwesome.glyphMap;

function iconGlyph(name: IconName) {
  const glyph = FontAwesome.glyphMap[name];
  return typeof glyph === "number" ? String.fromCharCode(glyph) : glyph;
}

export async function findIcon(
  screen: Awaited<ReturnType<typeof render>>,
  icon: IconName | Icon,
) {
  if (typeof icon === "string") {
    const glyph = iconGlyph(icon);
    return await screen.findByText(glyph);
  } else {
    return await screen.findByTestId(icon.name);
  }
}
