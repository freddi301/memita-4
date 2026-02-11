import { array, boolean, extract, number, object, string } from "./QL";

const accountUpdate = object({
  name: string("Alice"),
  timestamp: number(0),
  active: boolean(false),
});

const accountName = accountUpdate.field("name");

test("account name", () => {
  expect(accountName[extract]).toEqual("Alice");
});

const accountUpdates = array([
  accountUpdate,
  object({
    name: string("Bob"),
    timestamp: number(1),
    active: boolean(true),
  }),
]);

const accountUpdateIdentity = accountUpdates.map((update) => update);

test("account update identity", () => {
  expect(accountUpdateIdentity[extract]).toEqual([
    {
      name: "Alice",
      timestamp: 0,
      active: false,
    },
    {
      name: "Bob",
      timestamp: 1,
      active: true,
    },
  ]);
});

const accountNames = accountUpdates
  .map((update) => update.field("name"))
  .uniqueBy((name) => name);

test("account names", () => {
  expect(accountNames[extract]).toEqual(["Alice", "Bob"]);
});

const accountHistories = accountNames.map((name) => {
  const history = accountUpdates.filter((update) =>
    update.field("name").isEqual(name)
  );
  const latest = history.maxBy((update) => update.field("timestamp"));
  return object({ name, history, latest });
});

const accountList = accountHistories
  .filter((account) => account.field("latest").field("active"))
  .map((account) => account.field("name"));

test("account list", () => {
  expect(accountList[extract]).toEqual(["Bob"]);
});

test("concat", () => {
  const a = array([string("a"), string("b")]);
  const b = array([string("c"), string("d")]);
  const c = a.concat(b);
  expect(c[extract]).toEqual(["a", "b", "c", "d"]);
});
