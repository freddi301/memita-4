import { NetworkFactory } from "../store/store";

export const networkDummy: NetworkFactory = () => ({
  async start() {},
  async stop() {},
  async send() {},
  async getStartedDevices() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [];
  },
  async getConnectedDevices() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [];
  },
});
