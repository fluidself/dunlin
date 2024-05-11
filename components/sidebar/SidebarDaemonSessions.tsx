import { CSSProperties, memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useStore } from 'lib/store';
import ErrorBoundary from '../ErrorBoundary';
import SidebarDaemonSession from './SidebarDaemonSession';

function SidebarDaemonSessions() {
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const daemonSessions = useStore(state => state.daemonSessions);
  const activeDaemonSession = useStore(state => state.activeDaemonSession);

  const data = Object.values(daemonSessions).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const session = data[index];
      return (
        <SidebarDaemonSession
          key={session.id}
          session={session}
          isHighlighted={session.id === activeDaemonSession}
          style={style}
        />
      );
    },
    [activeDaemonSession, data],
  );

  if (!isDaemonUser) return null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col flex-1 overflow-x-hidden">
        {daemonSessions && Object.keys(daemonSessions).length ? (
          <div className="flex-1 overflow-y-auto">
            <AutoSizer>
              {({ width, height }: { width: number; height: number }) => (
                <List width={width} height={height} itemCount={data.length} itemSize={30}>
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        ) : (
          <p className="flex-1 px-6 my-2 text-center text-gray-500">No sessions yet</p>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(SidebarDaemonSessions);
