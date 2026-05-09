// fix for wrap act warnings
// Eagerly load RNTL so its hooks register at setup time, not inside a test callback
const { act } = require("@testing-library/react-native");
// require("@jest/globals").afterEach(async () => {
//   await act(async () => {
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//   });
// });
