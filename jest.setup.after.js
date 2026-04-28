// fix for wrap act warnings
require("@jest/globals").afterEach(async () => {
  await require("@testing-library/react-native").act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
});
