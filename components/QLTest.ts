import { array, boolean, number, object, string } from "./QL";

const accountUpdate = object({
  name: string("Alice"),
  timestamp: number(0),
  active: boolean(false),
});

const accountUpdates = array([accountUpdate]);

const accountNames = accountUpdates
  .map((update) => update.field("name"))
  .unique();
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
