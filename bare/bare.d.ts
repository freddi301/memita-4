declare const BareKit: {
  IPC: {
    write(data: Buffer): void;
    on(event: "data", callback: (data: Buffer) => void): void;
  };
};
