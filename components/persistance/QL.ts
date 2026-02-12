export type Plain =
  | boolean
  | number
  | string
  | Array<Plain>
  | { [key: string]: Plain };

// TODO do not export
export const extract = Symbol("secret");

export type Query<Data extends Plain> = {
  [extract]: Data;
} & (Data extends Array<infer Item extends Plain>
  ? {
      find(fn: (item: Query<Item>) => Query<boolean>): Query<Item>;
      filter(fn: (item: Query<Item>) => Query<boolean>): Query<Array<Item>>;
      map<NewItem extends Plain>(
        fn: (item: Query<Item>) => Query<NewItem>
      ): Query<Array<NewItem>>;
      flatMap<NewItem extends Plain>(
        fn: (item: Query<Item>) => Query<Array<NewItem>>
      ): Query<Array<NewItem>>;
      uniqueBy<Out extends Plain>(
        fn: (item: Query<Item>) => Query<Out>
      ): Query<Array<Item>>;
      maxBy(selector: (item: Query<Item>) => Query<number>): Query<Item>;
      orderBy(
        selector: (item: Query<Item>) => Query<number>,
        direction?: "asc" | "desc"
      ): Query<Array<Item>>;
      concat(other: Query<Array<Item>>): Query<Array<Item>>;
    }
  : Data extends Record<string, Plain>
  ? { field<Key extends keyof Data>(key: Key): Query<Data[Key]> }
  : Data extends boolean
  ? {
      isEqual(other: Query<boolean>): Query<boolean>;
      and(other: Query<boolean>): Query<boolean>;
      or(other: Query<boolean>): Query<boolean>;
      not(): Query<boolean>;
    }
  : Data extends number
  ? {
      isEqual(other: Query<Data>): Query<boolean>;
      toString(): Query<string>;
    }
  : Data extends string
  ? {
      isEqual(other: Query<Data>): Query<boolean>;
    }
  : {});

export function boolean(value: boolean): Query<boolean> {
  return {
    [extract]: value,
    isEqual(other: { [extract]: boolean }) {
      return boolean(value === other[extract]);
    },
    and(other: any) {
      return boolean(value && other[extract]);
    },
    or(other: any) {
      return boolean(value || other[extract]);
    },
    not() {
      return boolean(!value);
    },
  };
}

export function number(value: number): Query<number> {
  return {
    [extract]: value,
    isEqual(other: { [extract]: number }) {
      return boolean(value === other[extract]);
    },
    toString() {
      return string(value.toString());
    },
  };
}

export function string(value: string): Query<string> {
  return {
    [extract]: value,
    isEqual(other: { [extract]: string }) {
      return boolean(value === other[extract]);
    },
  };
}

export function array<Item extends Plain>(
  items: Array<Query<Item>>
): Query<Array<Item>> {
  return {
    items,
    [extract]: items.map((item) => item[extract]),
    find(fn: any) {
      return items.find((item) => fn(item)[extract])!;
    },
    filter(fn: any) {
      return array(items.filter((item) => fn(item)[extract]));
    },
    map(fn: any) {
      return array(items.map((item) => fn(item)));
    },
    flatMap(fn: any) {
      return array(items.flatMap((item) => fn(item).items));
    },
    uniqueBy(fn: any) {
      return array(
        Array.from(
          new Set(items.map((item) => JSON.stringify(fn(item)[extract])))
        ).map((serialized) => dataToQuery(JSON.parse(serialized)))
      );
    },
    maxBy(selector: any) {
      let maxItem = items[0];
      let maxValue = selector(maxItem)[extract];
      for (const item of items) {
        const value = selector(item)[extract];
        if (value > maxValue) {
          maxValue = value;
          maxItem = item;
        }
      }
      return maxItem;
    },
    orderBy(selector: any, direction: "asc" | "desc" = "asc") {
      return array(
        [...items].sort((a, b) =>
          direction === "asc"
            ? selector(a)[extract] - selector(b)[extract]
            : selector(b)[extract] - selector(a)[extract]
        )
      );
    },
    concat(other: any) {
      return array([...items, ...other.items]);
    },
  } as any;
}

export function object<Data extends Record<string, Plain>>(properties: {
  [K in keyof Data]: Query<Data[K]>;
}): Query<Data> {
  return {
    [extract]: Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, value[extract]])
    ),
    field(key: string) {
      return properties[key];
    },
  } as any;
}

export function dataToQuery<Data extends Plain>(data: Data): Query<Data> {
  if (typeof data === "boolean") {
    return boolean(data) as any;
  }
  if (typeof data === "number") {
    return number(data) as any;
  }
  if (typeof data === "string") {
    return string(data) as any;
  }
  if (Array.isArray(data)) {
    return array(data.map(dataToQuery)) as any;
  }
  if (typeof data === "object" && data !== null) {
    return object(
      Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, dataToQuery(value)])
      )
    ) as any;
  }
  throw new Error("not implemented");
}
