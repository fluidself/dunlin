import { Draft } from 'immer';
import { setter, Setter, Store } from './store';

export type DaemonMessage = {
  type: 'system' | 'human' | 'ai';
  text: string;
};

export type DaemonStore = {
  messages: DaemonMessage[];
  setMessages: Setter<DaemonMessage[]>;
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
