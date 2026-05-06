import { funEmoji } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { use, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { AccountId } from "../cryptography/cryptography";
import { FeApiContext } from "../store/feApi";
import { useTheme } from "../Theme";

export function CryptoAvatar({ accountId }: { accountId: AccountId }) {
  const theme = useTheme();
  const size = theme.textStyle.lineHeight * 2;

  const [isConnected, setIsConnected] = useState(false);
  const { store } = use(FeApiContext);
  useEffect(() => {
    let isActive = true;
    const poll = () => {
      if (!isActive) return;
      void store.isContactConnected(accountId).then((connected) => {
        if (isActive) {
          setIsConnected(connected);
          setTimeout(poll, 1000);
        }
      });
    };
    poll();
    return () => {
      isActive = false;
    };
  }, [accountId, store]);

  // TODO this loops for some reason
  // const isConnected = useMemitaQuery(isContactConnected, {
  //   contactId: accountId,
  // });

  const svg = useMemo(
    () => createAvatar(funEmoji, { seed: accountId, size: size }).toString(),
    [accountId, size],
  );
  return (
    <View style={{ width: size, height: size, opacity: isConnected ? 1 : 0.2 }}>
      <SvgXml xml={svg} width={size} height={size} />
    </View>
  );
}
