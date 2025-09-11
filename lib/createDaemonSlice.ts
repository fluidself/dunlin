import { Draft } from 'immer';
import { setter, Setter, Store, DaemonModel, DaemonMessage } from './store';

export type DaemonSession = {
  id: string;
  title: string;
  createdAt: string;
  messages: DaemonMessage[];
};

export type DaemonStore = {
  daemonSessions: Record<string, DaemonSession>;
  isDaemonUser: boolean;
  setIsDaemonUser: Setter<boolean>;
  isDaemonSidebarOpen: boolean;
  setIsDaemonSidebarOpen: Setter<boolean>;
  model: DaemonModel;
  setModel: Setter<DaemonModel>;
  temperature: number;
  setTemperature: Setter<number>;
  activeDaemonSession: string;
  setActiveDaemonSession: Setter<string>;
  insertDaemonSession: (session: DaemonSession) => void;
  renameDaemonSession: (sessionId: string, title: string) => void;
  deleteDaemonSession: (sessionId: string) => void;
  addMessageToDaemonSession: (sessionId: string, message: DaemonMessage) => void;
};

const createDaemonSlice = (set: (fn: (draft: Draft<Store>) => void) => void) => ({
  isDaemonUser: false,
  setIsDaemonUser: setter(set, 'isDaemonUser'),
  isDaemonSidebarOpen: false,
  setIsDaemonSidebarOpen: setter(set, 'isDaemonSidebarOpen'),
  model: DaemonModel['gemini-2.5-flash'],
  setModel: setter(set, 'model'),
  temperature: 0,
  setTemperature: setter(set, 'temperature'),
  activeDaemonSession: '',
  setActiveDaemonSession: setter(set, 'activeDaemonSession'),
  daemonSessions: {},
  insertDaemonSession: (session: DaemonSession) =>
    set(state => {
      state.daemonSessions[session.id] = session;
    }),
  deleteDaemonSession: (sessionId: string) =>
    set(state => {
      delete state.daemonSessions[sessionId];
    }),
  renameDaemonSession: (sessionId: string, title: string) =>
    set(state => {
      if (state.daemonSessions[sessionId]) {
        state.daemonSessions[sessionId].title = title;
      }
    }),
  addMessageToDaemonSession: (sessionId: string, message: DaemonMessage) =>
    set(state => {
      if (state.daemonSessions[sessionId]) {
        const messages = state.daemonSessions[sessionId].messages;
        state.daemonSessions[sessionId].messages = [...messages, message];
      }
    }),
});

export default createDaemonSlice;
