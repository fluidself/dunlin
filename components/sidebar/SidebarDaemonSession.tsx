import { CSSProperties, memo, useRef, useState } from 'react';
import classNames from 'classnames';
import { type DaemonSession, useStore } from 'lib/store';
import SidebarDaemonSessionDropdown from './SidebarDaemonSessionDropdown';
import SidebarItem from './SidebarItem';

type Props = {
  session: DaemonSession;
  isHighlighted: boolean;
  style?: CSSProperties;
};

function SidebarDaemonSession({ session, isHighlighted, style }: Props) {
  const darkMode = useStore(state => state.darkMode);
  const setIsDaemonSidebarOpen = useStore(state => state.setIsDaemonSidebarOpen);
  const setActiveDaemonSession = useStore(state => state.setActiveDaemonSession);
  const renameDaemonSession = useStore(state => state.renameDaemonSession);
  const [isEditable, setIsEditable] = useState(false);
  const titleRef = useRef<HTMLSpanElement | null>(null);

  const handleTitleClick = () => {
    setIsEditable(true);
    setTimeout(() => {
      if (!titleRef.current) return;
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(titleRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      titleRef.current.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditable(false);
      renameDaemonSession(session.id, titleRef.current?.innerText ?? '');
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditable(false);
    }
  };

  return (
    <SidebarItem
      className="relative flex items-center overflow-hidden h-full group focus:outline-none hover:bg-gray-50 active:bg-gray-50 dark:hover:bg-gray-800 dark:active:bg-gray-800"
      style={style}
    >
      <div
        className="flex items-center flex-1 h-full overflow-hidden select-none cursor-default group/note"
        draggable={false}
      >
        <div
          role="button"
          className={classNames(
            'flex items-center flex-1 h-full rounded-sm cursor-pointer overflow-hidden overflow-ellipsis whitespace-nowrap pl-[15px]',
            {
              'hover:bg-gray-100 group-hover:bg-gray-100 group-hover/note:bg-gray-100 group-active/note:bg-gray-200':
                !darkMode,
            },
            {
              'hover:bg-gray-700 group-hover:bg-gray-700 group-active/note:bg-gray-600': darkMode,
            },
            { 'bg-gray-100 dark:bg-gray-700': isHighlighted },
          )}
          onClick={e => {
            e.preventDefault();
            setActiveDaemonSession(session.id);
            setIsDaemonSidebarOpen(true);
          }}
        >
          <span
            className={classNames('overflow-hidden overflow-ellipsis whitespace-nowrap text-sm', {
              'w-full bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-700 input': isEditable,
            })}
            ref={titleRef}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditable(false)}
          >
            {session?.title ?? ''}
          </span>
        </div>
        <SidebarDaemonSessionDropdown session={session} onRenameClick={handleTitleClick} />
      </div>
    </SidebarItem>
  );
}

export default memo(SidebarDaemonSession);
