import { Draft } from 'immer';
import { setter, Setter, Store, DaemonModel } from './store';

export type DaemonMessage = {
  type: 'system' | 'human' | 'ai';
  text: string;
};

export type DaemonStore = {
  isDaemonUser: boolean;
  setIsDaemonUser: Setter<boolean>;
  isDaemonSidebarOpen: boolean;
  setIsDaemonSidebarOpen: Setter<boolean>;
  messages: DaemonMessage[];
  setMessages: Setter<DaemonMessage[]>;
  model: DaemonModel;
  setModel: Setter<DaemonModel>;
  temperature: number;
  setTemperature: Setter<number>;
};

const createDaemonSlice = (set: (fn: (draft: Draft<Store>) => void) => void) => ({
  isDaemonUser: false,
  setIsDaemonUser: setter(set, 'isDaemonUser'),
  isDaemonSidebarOpen: false,
  setIsDaemonSidebarOpen: setter(set, 'isDaemonSidebarOpen'),
  messages: [],
  setMessages: setter(set, 'messages'),
  model: DaemonModel['gpt-3.5-turbo'],
  setModel: setter(set, 'model'),
  temperature: 0,
  setTemperature: setter(set, 'temperature'),
});

export default createDaemonSlice;
