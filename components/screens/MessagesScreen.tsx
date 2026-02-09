export function MessagesScreen() {}

type Message = {
  type: "message";
  from: string;
  to: string;
  content: string;
};
