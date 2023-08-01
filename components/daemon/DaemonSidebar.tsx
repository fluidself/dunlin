import { memo, useMemo } from 'react';
import { useTransition, animated } from '@react-spring/web';
import useHotkeys from 'utils/useHotkeys';
import { isMobile } from 'utils/device';
import { useStore } from 'lib/store';
import { SPRING_CONFIG } from 'constants/spring';
import Daemon from './Daemon';

function DaemonSidebar() {
  const isDaemonSidebarOpen = useStore(state => state.isDaemonSidebarOpen);
  const setIsDaemonSidebarOpen = useStore(state => state.setIsDaemonSidebarOpen);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => setIsDaemonSidebarOpen(false),
      },
    ],
    [setIsDaemonSidebarOpen],
  );
  useHotkeys(hotkeys);

  const transition = useTransition<
    boolean,
    {
      transform: string;
      dspl: number;
      backgroundOpacity: number;
      backgroundColor: string;
    }
  >(isDaemonSidebarOpen, {
    initial: {
      transform: 'translateX(0%)',
      dspl: 1,
      backgroundOpacity: 0.3,
      backgroundColor: 'black',
    },
    from: {
      transform: 'translateX(100%)',
      dspl: 0,
      backgroundOpacity: 0,
      backgroundColor: 'transparent',
    },
    enter: {
      transform: 'translateX(0%)',
      dspl: 1,
      backgroundOpacity: 0.3,
      backgroundColor: 'black',
    },
    leave: {
      transform: 'translateX(100%)',
      dspl: 0,
      backgroundOpacity: 0,
      backgroundColor: 'transparent',
    },
    config: SPRING_CONFIG,
    expires: item => !item,
  });

  return transition(
    (styles, item) =>
      item && (
        <>
          {isMobile() ? (
            <animated.div
              className="fixed inset-0 z-10"
              style={{
                backgroundColor: styles.backgroundColor,
                opacity: styles.backgroundOpacity,
                display: styles.dspl.to(displ => (displ === 0 ? 'none' : 'initial')),
              }}
              onClick={() => setIsDaemonSidebarOpen(false)}
            />
          ) : null}
          <animated.div
            className="fixed top-0 bottom-0 right-0 z-20 w-192 md:w-[850px] shadow-popover md:shadow-none md:static md:z-0"
            style={{
              transform: styles.transform,
              display: styles.dspl.to(displ => (displ === 0 ? 'none' : 'initial')),
            }}
          >
            <div className="h-full border-l bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
              <Daemon />
            </div>
          </animated.div>
        </>
      ),
  );
}

export default memo(DaemonSidebar);
