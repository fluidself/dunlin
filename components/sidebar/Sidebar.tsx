import { memo, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconAffiliate, IconSearch } from '@tabler/icons';
import { useTransition, animated } from '@react-spring/web';
import { isMobile, modifierKey } from 'utils/device';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useStore } from 'lib/store';
import { SPRING_CONFIG } from 'constants/spring';
import { CreateJoinRenameDeckType } from 'components/CreateJoinRenameDeckModal';
import Tooltip from 'components/Tooltip';
import SidebarItem from './SidebarItem';
import SidebarContent from './SidebarContent';
import SidebarHeader from './SidebarHeader';

type Props = {
  setIsFindOrCreateModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
  setCreateJoinRenameModal: (modalStatus: { open: boolean; type: CreateJoinRenameDeckType }) => void;
  className?: string;
};

function Sidebar(props: Props) {
  const { setIsFindOrCreateModalOpen, setIsSettingsOpen, setCreateJoinRenameModal, className = '' } = props;

  const { id: deckId } = useCurrentDeck();
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const hideSidebarOnMobile = useCallback(() => {
    if (isMobile()) {
      setIsSidebarOpen(false);
    }
  }, [setIsSidebarOpen]);

  const transition = useTransition<
    boolean,
    {
      transform: string;
      dspl: number;
      backgroundOpacity: number;
      backgroundColor: string;
    }
  >(isSidebarOpen, {
    initial: {
      transform: 'translateX(0%)',
      dspl: 1,
      backgroundOpacity: 0.3,
      backgroundColor: 'black',
    },
    from: {
      transform: 'translateX(-100%)',
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
      transform: 'translateX(-100%)',
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
              onClick={() => setIsSidebarOpen(false)}
            />
          ) : null}
          <animated.div
            className="fixed top-0 bottom-0 left-0 z-20 w-72 shadow-popover md:shadow-none md:static md:z-0"
            style={{
              transform: styles.transform,
              display: styles.dspl.to(displ => (displ === 0 ? 'none' : 'initial')),
            }}
          >
            <div
              className={`flex flex-col flex-none h-full border-r bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 ${className}`}
            >
              <SidebarHeader
                setIsSettingsOpen={setIsSettingsOpen}
                setCreateJoinRenameModal={setCreateJoinRenameModal}
              />
              <FindOrCreateModalButton
                onClick={() => {
                  hideSidebarOnMobile();
                  setIsFindOrCreateModalOpen(isOpen => !isOpen);
                }}
              />
              {deckId && <GraphButton onClick={hideSidebarOnMobile} deckId={deckId} />}
              <SidebarContent
                className="flex-1 mt-3 overflow-x-hidden overflow-y-auto"
                setIsFindOrCreateModalOpen={setIsFindOrCreateModalOpen}
              />
            </div>
          </animated.div>
        </>
      ),
  );
}

type FindOrCreateModalButtonProps = {
  onClick: () => void;
};

const FindOrCreateModalButton = (props: FindOrCreateModalButtonProps) => {
  const { onClick } = props;
  return (
    <SidebarItem>
      <Tooltip
        content={`Quickly jump to a note, or create a new note (${modifierKey()}+P)`}
        placement="right"
        touch={false}
      >
        <button className="flex items-center w-full h-8 px-6 py-1 text-left" onClick={onClick}>
          <IconSearch className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={16} />
          <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap text-sm">
            Find or create note
          </span>
        </button>
      </Tooltip>
    </SidebarItem>
  );
};

type GraphButtonProps = {
  onClick: () => void;
  deckId: string;
};

const GraphButton = (props: GraphButtonProps) => {
  const { onClick, deckId } = props;
  const router = useRouter();

  return (
    <SidebarItem isHighlighted={router.pathname.includes(`/app/${deckId}/graph`)} onClick={onClick}>
      <Tooltip
        content={`Visualization of all of your notes as a network (${modifierKey()}+Shift+G)`}
        placement="right"
        touch={false}
      >
        <span>
          <Link href={`/app/${deckId}/graph`} className="flex items-center h-8 px-6 py-1">
            <IconAffiliate className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={16} />
            <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap text-sm">
              Graph view
            </span>
          </Link>
        </span>
      </Tooltip>
    </SidebarItem>
  );
};

export default memo(Sidebar);
