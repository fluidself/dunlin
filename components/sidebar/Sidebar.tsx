import { memo, useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconAffiliate, IconSearch } from '@tabler/icons';
import { useTransition, animated } from '@react-spring/web';
import { toast } from 'react-toastify';
import { isMobile } from 'utils/device';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { encryptWithLit } from 'utils/encryption';
import { useStore } from 'lib/store';
import supabase from 'lib/supabase';
import { SPRING_CONFIG } from 'constants/spring';
import { AccessControlCondition, BooleanCondition } from 'types/lit';
import { Deck } from 'types/supabase';
import ShareModal from 'components/share-modal/ShareModal';
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
  const { setIsFindOrCreateModalOpen, setIsSettingsOpen, setCreateJoinRenameModal, className } = props;

  const { user } = useAuth();
  const { id: deckId, key } = useCurrentDeck();
  const setCollaborativeDeck = useStore(state => state.setCollaborativeDeck);
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const hideSidebarOnMobile = useCallback(() => {
    if (isMobile()) {
      setIsSidebarOpen(false);
    }
  }, [setIsSidebarOpen]);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [processingAccess, setProcessingAccess] = useState<boolean>(false);

  const provisionAccess = async (acc: AccessControlCondition[]) => {
    if (!user || !deckId || !acc) return;

    try {
      const accessControlConditions: (AccessControlCondition | BooleanCondition)[] = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: user.id,
          },
        },
        { operator: 'or' },
        ...acc,
      ];
      const [encryptedStringBase64, encryptedSymmetricKeyBase64] = await encryptWithLit(key, accessControlConditions);
      const accessParams = {
        encrypted_string: encryptedStringBase64,
        encrypted_symmetric_key: encryptedSymmetricKeyBase64,
        access_control_conditions: accessControlConditions,
      };

      const { data: deck, error } = await supabase
        .from<Deck>('decks')
        .update({ access_params: accessParams })
        .eq('id', deckId)
        .single();

      if (!deck || error) {
        toast.error('Provisioning access failed.');
        return false;
      }

      await setCollaborativeDeck(accessControlConditions.length > 1);

      toast.success('Access to your DECK was configured');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Provisioning access failed.');
      return false;
    }
  };

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
            className="fixed top-0 bottom-0 left-0 z-20 w-64 shadow-popover md:shadow-none md:static md:z-0"
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
                setIsShareModalOpen={setIsShareModalOpen}
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
          {isShareModalOpen && (
            <ShareModal
              onClose={() => setIsShareModalOpen(false)}
              deckToShare={deckId}
              processingAccess={processingAccess}
              onAccessControlConditionsSelected={async (acc: AccessControlCondition[]) => {
                setProcessingAccess(true);
                const success = await provisionAccess(acc);
                if (success) {
                  setProcessingAccess(false);
                  return true;
                }
                setProcessingAccess(false);
              }}
              showStep={'ableToAccess'}
            />
          )}
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
      <Tooltip content="Quickly jump to a note, or create a new note (Ctrl+P)" placement="right" touch={false}>
        <button className="flex items-center w-full px-6 py-1 text-left" onClick={onClick}>
          <IconSearch className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
          <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">Find or Create Note</span>
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
      <Tooltip content="Visualization of all of your notes as a network (Ctrl+Shift+G)" placement="right" touch={false}>
        <span>
          <Link href={`/app/${deckId}/graph`} className="flex items-center px-6 py-1">
            <IconAffiliate className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
            <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">Graph View</span>
          </Link>
        </span>
      </Tooltip>
    </SidebarItem>
  );
};

export default memo(Sidebar);
