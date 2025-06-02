import { EventEmitter } from "expo-modules-core";

// Define the events map for the web EventEmitter
type WebEpsonEvents = {
  onChange: (event: { value: string }) => void;
};

const emitter = new EventEmitter<WebEpsonEvents>();

export default {
  PI: Math.PI,
  async setValueAsync(value: string): Promise<void> {
    emitter.emit("onChange", { value });
  },
  hello() {
    return "Hello world! 👋";
  },
};
