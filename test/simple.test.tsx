import { render } from "@testing-library/react-native";
import Main from "../app/index";

describe("FAKE", () => {
  test("render on screen", () => {
    const { getByText } = render(<Main />);
    expect(getByText("Welcome")).toBeOnTheScreen();
  });
});
