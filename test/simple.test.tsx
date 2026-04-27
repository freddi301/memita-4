import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import Index from "../app/index";

const mockAsyncStorage = require("@react-native-async-storage/async-storage/jest");
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

describe("FAKE", () => {
  test("render on screen", () => {
    console.log(Index);
    const { getByText } = render(<Text>Welcome</Text>);
    expect(getByText("Welcome")).toBeOnTheScreen();
  });
});
