import { createTestApp } from "./utils/createTestApp";

test("app starts", async () => {
  const { screen } = await createTestApp();

  expect(await screen.findByText("Memita")).toBeVisible();
});
