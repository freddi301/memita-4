import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { dataApi } from "../dataApi";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { mutateAsync: removeAccount } = useMutation({
    async mutationFn() {
      await dataApi.accounts.create({
        id: accountId,
        isActive: false,
        timestamp: Date.now(),
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
  return (
    <View>
      <ScreenLink
        to={<SelectAccountScreen />}
        label={translate({
          en: "Select another account",
          it: "Seleziona un altro account",
        })}
      />
      <Text style={theme.textStyle}>{accountId}</Text>
      <ScreenLink
        to={async () => {
          await removeAccount();
          return <SelectAccountScreen />;
        }}
        label={translate({
          en: "Remove account from this device",
          it: "Rimuovi account da questo dispositivo",
        })}
      />
    </View>
  );
}
