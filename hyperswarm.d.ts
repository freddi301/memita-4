declare module "hyperswarm" {
  export = Hyperswarm;
  class Hyperswarm {
    constructor(): void;
    on(
      event: "connection",
      callback: (connection: Connection, info: PeerInfo) => void
    ): void;
    join(
      topic: Buffer,
      options: { server: boolean; client: boolean }
    ): Promise<Discovery>;
    leave(topic: Buffer): Promise<void>;
    suspended: boolean;
    connectin: number;
    destroyed: boolean;
    connections: Set<Connection>;
    keyPair: {
      publicKey: Buffer;
      secretKey: Buffer;
    };
  }
  type Connection = {
    on(event: "data", callback: (data: Buffer) => void): void;
  };
  type PeerInfo = {
    publicKey: Buffer;
  };
  type Discovery = {};
}
