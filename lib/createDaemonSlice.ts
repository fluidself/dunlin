import { Draft } from 'immer';
import type { ChatCompletionMessage } from 'utils/openai-stream';
import { setter, Setter, Store } from './store';

export type DaemonStore = {
  messages: ChatCompletionMessage[];
  setMessages: Setter<ChatCompletionMessage[]>;
  temperature: number;
  setTemperature: Setter<number>;
  maxTokens: number;
  setMaxTokens: Setter<number>;
};

const createDaemonSlice = (set: (fn: (draft: Draft<Store>) => void) => void) => ({
  messages: [],
  setMessages: setter(set, 'messages'),
  temperature: 0.5,
  setTemperature: setter(set, 'temperature'),
  maxTokens: 1000,
  setMaxTokens: setter(set, 'maxTokens'),
});

export default createDaemonSlice;
