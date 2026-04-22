declare const BareKit: {
  IPC: {
    write(data: Uint8Array): void;
    on(event: "data", callback: (data: Uint8Array) => void): void;
    readable: ReadableStream<Uint8Array>;
  };
};
