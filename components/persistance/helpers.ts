export type Collection<Item> = {
  __array: Array<Item>;
  filter(predicate: (item: Item) => boolean): Collection<Item>;
  map<Result>(mapper: (item: Item) => Result): Collection<Result>;
  flatMap<Result>(
    mapper: (item: Item) => Collection<Result>
  ): Collection<Result>;
  groupBy<Result>(
    criteria: (item: Item) => Array<string | number>,
    mapper: (group: Collection<Item>) => Collection<Result>
  ): Collection<Result>;
  maxBy(criteria: (item: Item) => number): Collection<Item>;
  concat(other: Collection<Item>): Collection<Item>;
};

export function collection<Item>(array: Array<Item>): Collection<Item> {
  return {
    __array: array,
    filter(predicate) {
      return collection(array.filter(predicate));
    },
    map(mapper) {
      return collection(array.map(mapper));
    },
    flatMap(mapper) {
      return collection(array.flatMap((item) => mapper(item).__array));
    },
    groupBy<Result>(
      criteria: (item: Item) => [string | number],
      mapper: (group: Collection<Item>) => Collection<Result>
    ): Collection<Result> {
      const groups = new Map<string, Array<Item>>();
      array.forEach((item) => {
        const key = JSON.stringify(criteria(item));
        const group = groups.get(key) || [];
        group.push(item);
        groups.set(key, group);
      });
      const result: Array<Result> = [];
      groups.forEach((group) => {
        result.push(...mapper(collection(group)).__array);
      });
      return collection(result);
    },
    maxBy(criteria: (item: Item) => number): Collection<Item> {
      let maxItem: Item | null = null;
      let maxValue = -Infinity;
      array.forEach((item) => {
        const value = criteria(item);
        if (value > maxValue) {
          maxValue = value;
          maxItem = item;
        }
      });
      if (maxItem === null) {
        return collection([]);
      }
      return collection([maxItem]);
    },
    concat(other) {
      return collection(array.concat(other.__array));
    },
  };
}
