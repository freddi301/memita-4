import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../persistance/Queries";
import { queryClient } from "../queryClient";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();
  const { data: latest } = useSuspenseQuery(
    {
      queryKey: ["accountLatest", { accountId }],
      queryFn: () =>
        dataApi.read((root) => allQueries(root).accountLatest(accountId)),
    },
    queryClient
  );
  const { mutateAsync: updateAccount } = useMutation(
    {
      async mutationFn({ name, active }: { name: string; active: boolean }) {
        await dataApi.write((root) =>
          allQueries(root).updateAccount({ id: accountId, name, active })
        );
      },
      async onSuccess() {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["accounts"] }),
          queryClient.invalidateQueries({
            queryKey: ["accountLatest", { accountId }],
          }),
        ]);
      },
    },
    queryClient
  );

  const nameOriginal = latest.name;
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = nameInput !== nameOriginal;

  return (
    <Fragment>
      <ScreenLink
        to={<SelectAccountScreen />}
        icon="arrow-left"
        label={translate({
          en: "Select another account",
          it: "Seleziona un altro account",
        })}
        enabled={!canSave}
      />
      <ScrollView>
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
          {nameInput !== nameOriginal ? (
            <Text
              style={{
                ...theme.secondaryTextStyle,
                textDecorationLine: "line-through",
              }}
            >
              {nameOriginal || " "}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingVertical: 8 }}>
        <ScreenLink
          to={async () => {
            await updateAccount({ name: nameOriginal, active: false });
            return <SelectAccountScreen />;
          }}
          icon="trash"
          label={translate({
            en: "Remove account from this device",
            it: "Rimuovi account da questo dispositivo",
          })}
          enabled={!canSave}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <ScreenLink
            to={async () => {
              setNameInput(nameOriginal);
            }}
            icon="undo"
            label={translate({
              en: "Discard changes",
              it: "Scarta modifiche",
            })}
            enabled={canSave}
          />
          <ScreenLink
            to={async () => {
              await updateAccount({ name: nameInput, active: true });
            }}
            icon="save"
            label={translate({
              en: "Save changes",
              it: "Salva modifiche",
            })}
            enabled={canSave}
          />
        </View>
      </View>
      <BottomTabNavigation accountId={accountId} enabled={!canSave} />
    </Fragment>
  );
}
