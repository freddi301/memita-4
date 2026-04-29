import { funEmoji } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { SvgXml } from "react-native-svg";
import { AccountId } from "../cryptography/cryptography";
import { useTheme } from "../Theme";

export function CryptoAvatar({ accountId }: { accountId: AccountId }) {
  const theme = useTheme();
  const size = theme.textStyle.lineHeight * 2;
  const svg = createAvatar(funEmoji, { seed: accountId, size }).toString();
  return <SvgXml xml={svg} width={size} height={size} />;
}
