import { setUpTests } from "react-native-reanimated";

jest.mock("react-native-worklets", () =>
  require("react-native-worklets/lib/module/mock"),
);

setUpTests();
