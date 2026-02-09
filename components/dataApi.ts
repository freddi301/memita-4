import AsyncStorage from "@react-native-async-storage/async-storage";

type DataSchemaShape =
  | {
      type: "boolean";
    }
  | {
      type: "number";
    }
  | {
      type: "string";
    }
  | {
      type: "object";
      properties: Record<string, DataSchemaShape>;
    };

const boolean = { type: "boolean" } satisfies DataSchemaShape;
const number = { type: "number" } satisfies DataSchemaShape;
const string = { type: "string" } satisfies DataSchemaShape;
function object<Properties extends Record<string, DataSchemaShape>>(
  properties: Properties
) {
  return { type: "object", properties } satisfies DataSchemaShape;
}

type TypeOfSchema<T extends DataSchemaShape> = T extends { type: "boolean" }
  ? boolean
  : T extends { type: "number" }
  ? number
  : T extends { type: "string" }
  ? string
  : T extends { type: "object"; properties: infer P }
  ? {
      [K in keyof P]: P[K] extends DataSchemaShape ? TypeOfSchema<P[K]> : never;
    }
  : never;

type DataApi<Tables extends Record<string, DataSchemaShape>> = {
  [K in keyof Tables]: {
    getAll(): Promise<Array<TypeOfSchema<Tables[K]>>>;
    create(record: TypeOfSchema<Tables[K]>): Promise<void>;
  };
};

function inMemoryDataApi<Tables extends Record<string, DataSchemaShape>>(
  tableSchemas: Tables
): DataApi<Tables> {
  const data = Object.fromEntries(
    Object.keys(tableSchemas).map((tableName) => [tableName, []])
  ) as any as { [K in keyof Tables]: Array<TypeOfSchema<Tables[K]>> };
  return Object.fromEntries(
    Object.keys(tableSchemas).map((tableName) => [
      tableName,
      {
        async getAll() {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return data[tableName];
        },
        async create(record: TypeOfSchema<Tables[typeof tableName]>) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          data[tableName].push(record);
        },
      },
    ])
  ) as any as DataApi<Tables>;
}

function asyncStorageDataApi<Tables extends Record<string, DataSchemaShape>>(
  tableSchemas: Tables
): DataApi<Tables> {
  return Object.fromEntries(
    Object.keys(tableSchemas).map((tableName) => [
      tableName,
      {
        async getAll() {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const json = await AsyncStorage.getItem("data");
          const data = JSON.parse(json || "{}");
          return data[tableName] ?? [];
        },
        async create(record: TypeOfSchema<Tables[typeof tableName]>) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const json = await AsyncStorage.getItem("data");
          const data = JSON.parse(json || "{}");
          data[tableName] = data[tableName] ?? [];
          data[tableName].push(record);
          await AsyncStorage.setItem("data", JSON.stringify(data));
        },
      },
    ])
  ) as any as DataApi<Tables>;
}

const dataSchema = {
  accounts: object({
    id: string,
  }),
};

export const dataApi = asyncStorageDataApi(dataSchema);

export function createAccountId() {
  return Math.random().toString(36).slice(2);
}
