import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../persistance/Queries";
import { queryClient } from "../queryClient";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();
  const { data: history } = useSuspenseQuery(
    {
      queryKey: ["history", accountId],
      queryFn: () =>
        dataApi.read((root) => allQueries(root).accountHistory(accountId)),
    },
    queryClient
  );
  const { mutateAsync: updateAccount } = useMutation(
    {
      async mutationFn({ name, active }: { name: string; active: boolean }) {
        await dataApi.write((root) =>
          allQueries(root).updateAccount(accountId, name, active)
        );
      },
      async onSuccess() {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["accounts"] }),
          queryClient.invalidateQueries({ queryKey: ["history", accountId] }),
        ]);
      },
    },
    queryClient
  );

  const nameOriginal = history[0].name;
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  return (
    <View style={{ flexGrow: 1 }}>
      <ScreenLink
        to={<SelectAccountScreen />}
        label={translate({
          en: "Select another account",
          it: "Seleziona un altro account",
        })}
      />
      <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text style={theme.secondaryTextStyle}>
          {translate({
            en: "Account ID",
            it: "ID dell'account",
          })}
        </Text>
        <Text style={theme.textStyle}>{accountId}</Text>
      </View>
      <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text style={theme.secondaryTextStyle}>
          {translate({
            en: "Account name",
            it: "Nome dell'account",
          })}
        </Text>
        <TextInput
          value={nameInput}
          onChangeText={setNameInput}
          style={theme.textInputStyle}
        />
      </View>
      <View
        style={{
          gap: 2,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexGrow: 1,
        }}
      >
        <Text style={theme.secondaryTextStyle}>
          {translate({
            en: "Account history",
            it: "Storia dell'account",
          })}
        </Text>
        <Text style={theme.textStyle}>{JSON.stringify(history)}</Text>
      </View>
      <View style={{ paddingVertical: 8 }}>
        <ScreenLink
          to={async () => {
            await updateAccount({ name: nameOriginal, active: false });
            return <SelectAccountScreen />;
          }}
          label={translate({
            en: "Remove account from this device",
            it: "Rimuovi account da questo dispositivo",
          })}
        />
        <ScreenLink
          to={async () => {
            await updateAccount({ name: nameInput, active: true });
          }}
          label={translate({
            en: "Save changes",
            it: "Salva modifiche",
          })}
        />
      </View>
    </View>
  );
}
