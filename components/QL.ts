type Plain =
  | boolean
  | number
  | string
  | Array<Plain>
  | { [key: string]: Plain };

const extract = Symbol("secret");

export function boolean(value: boolean) {
  return {
    [extract]: value,
    isEqual(other: { [extract]: boolean }) {
      return boolean(value === other[extract]);
    },
  };
}

export function number(value: number) {
  return {
    [extract]: value,
    isEqual(other: { [extract]: number }) {
      return boolean(value === other[extract]);
    },
  };
}

export function string(value: string) {
  return {
    [extract]: value,
    isEqual(other: { [extract]: string }) {
      return boolean(value === other[extract]);
    },
  };
}

export function array<Item extends { [extract]: Plain }>(items: Array<Item>) {
  return {
    [extract]: items.map((item) => item[extract]) as Array<
      Item[typeof extract]
    >,
    filter(predicate: (item: Item) => { [extract]: boolean }) {
      return array(items.filter((item) => predicate(item)));
    },
    map<NewItem extends { [extract]: Plain }>(fn: (item: Item) => NewItem) {
      return array(items.map((item) => fn(item)));
    },
    unique() {
      return array(items); // TODO
    },
    maxBy(selector: (item: Item) => { [extract]: number }) {
      return items[0]; // TODO
    },
  };
}

export function object<Properties extends Record<string, { [extract]: Plain }>>(
  properties: Properties
) {
  return {
    [extract]: Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, value[extract]])
    ) as { [K in keyof Properties]: Properties[K][typeof extract] },
    field<Key extends keyof Properties>(key: Key) {
      return properties[key];
    },
  };
}
