import { funEmoji } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { use, useEffect, useMemo, useState } from "react";
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
          console.log("Contact", accountId, "connected:", connected);
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

  const svg = useMemo(
    () =>
      createAvatar(funEmoji, {
        seed: accountId,
        size: isConnected ? size : size * 0.5,
      }).toString(),
    [accountId, size, isConnected],
  );
  return (
    <SvgXml
      xml={svg}
      width={isConnected ? size : size * 0.5}
      height={isConnected ? size : size * 0.5}
    />
  );
}
