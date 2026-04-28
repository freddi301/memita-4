import { FontAwesome } from "@expo/vector-icons";
import { render } from "@testing-library/react-native";

type IconName = keyof typeof FontAwesome.glyphMap;

function iconGlyph(name: IconName) {
  const glyph = FontAwesome.glyphMap[name];
  return typeof glyph === "number" ? String.fromCharCode(glyph) : glyph;
}

export async function findIcon(
  screen: Awaited<ReturnType<typeof render>>,
  iconName: IconName,
) {
  const glyph = iconGlyph(iconName);
  return await screen.findByText(glyph);
}
