// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { memo, useCallback, useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconAffiliate, IconSearch, IconLogout, IconShare, IconFolderPlus, IconGitPullRequest } from '@tabler/icons';
import { useTransition, animated } from '@react-spring/web';
import { toast } from 'react-toastify';
import Tooltip from 'components/Tooltip';
import { isMobile } from 'utils/device';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useStore } from 'lib/store';
import supabase from 'lib/supabase';
import useIsMounted from 'utils/useIsMounted';
import { SPRING_CONFIG } from 'constants/spring';
import SidebarItem from './SidebarItem';
import SidebarContent from './SidebarContent';
import SidebarHeader from './SidebarHeader';
import { ShareModal } from 'components/ShareModal';
import { AccessControlCondition, AuthSig, ResourceId } from 'types/lit';
import { Deck, AccessParams } from 'types/supabase';
import CreateOrJoinDeckModal from 'components/CreateOrJoinDeckModal';

type Props = {
  setIsFindOrCreateModalOpen: Dispatch<SetStateAction<boolean>>;
  className?: string;
};

function Sidebar(props: Props) {
  const { setIsFindOrCreateModalOpen, className } = props;

  const { user, signOut } = useAuth();
  const { deck } = useCurrentDeck();
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const hideSidebarOnMobile = useCallback(() => {
    if (isMobile()) {
      setIsSidebarOpen(false);
    }
  }, [setIsSidebarOpen]);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [processingAccess, setProcessingAccess] = useState<boolean>(false);
  const [createOrJoinModal, setCreateOrJoinModal] = useState<any>({ open: false, type: '' });

  const isMounted = useIsMounted();

  useEffect(() => {
    const initLit = async () => {
      const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
      await client.connect();
      window.litNodeClient = client;
    };

    if (!window.litNodeClient && isMounted() && user) {
      initLit();
    }
  }, [isMounted, user]);

  const provisionAccess = async (accessControlConditions: AccessControlCondition[]) => {
    if (!deck || !accessControlConditions) return;

    try {
      const chain = accessControlConditions[0].chain;
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const resourceId: ResourceId = {
        baseUrl: process.env.BASE_URL ?? '',
        path: `/app/${deck?.id}`,
        orgId: '',
        role: '',
        extraData: '',
      };

      await window.litNodeClient.saveSigningCondition({
        accessControlConditions,
        chain,
        authSig,
        resourceId,
        permanent: false,
      });

      const accessParamsToSave: AccessParams = { resource_id: resourceId, access_control_conditions: accessControlConditions };
      await supabase.from<Deck>('decks').update({ access_params: accessParamsToSave }).eq('id', deck.id);

      toast.success('Access to your DECK was configured');
    } catch (e: any) {
      console.error(e);
      toast.error('Provisioning access failed.');
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
              <SidebarHeader />
              <FindOrCreateModalButton
                onClick={() => {
                  hideSidebarOnMobile();
                  setIsFindOrCreateModalOpen(isOpen => !isOpen);
                }}
              />
              {deck && <GraphButton onClick={hideSidebarOnMobile} deckId={deck?.id} />}
              <ShareModalButton
                onClick={() => {
                  setIsShareModalOpen(isOpen => !isOpen);
                }}
              />
              <SidebarItem>
                <button
                  className="flex items-center w-full px-6 py-1 text-left"
                  onClick={() => setCreateOrJoinModal({ open: true, type: 'join' })}
                >
                  <IconGitPullRequest className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
                  <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">Join DECK</span>
                </button>
              </SidebarItem>
              <SidebarItem>
                <button
                  className="flex items-center w-full px-6 py-1 text-left"
                  onClick={() => setCreateOrJoinModal({ open: true, type: 'create' })}
                >
                  <IconFolderPlus className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
                  <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">New DECK</span>
                </button>
              </SidebarItem>
              <SidebarItem className="cursor-pointer">
                <button className="flex items-center pl-6 py-1" onClick={signOut}>
                  <IconLogout className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
                  <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">Sign Out</span>
                </button>
              </SidebarItem>
              <SidebarContent
                className="flex-1 mt-3 overflow-x-hidden overflow-y-auto"
                setIsFindOrCreateModalOpen={setIsFindOrCreateModalOpen}
              />
            </div>
          </animated.div>
          {isShareModalOpen && (
            <ShareModal
              onClose={() => setIsShareModalOpen(false)}
              deckToShare={deck?.id}
              processingAccess={processingAccess}
              onAccessControlConditionsSelected={async (acc: AccessControlCondition[]) => {
                setProcessingAccess(true);
                await provisionAccess(acc);
                setProcessingAccess(false);
                return true;
              }}
              showStep={'ableToAccess'}
            />
          )}
          {createOrJoinModal.open && (
            <CreateOrJoinDeckModal
              type={createOrJoinModal.type}
              closeModal={() => setCreateOrJoinModal({ open: false, type: '' })}
            />
          )}
        </>
      ),
  );
}

type ShareModalButtonProps = {
  onClick: () => void;
};

const ShareModalButton = (props: ShareModalButtonProps) => {
  const { onClick } = props;
  return (
    <SidebarItem>
      <Tooltip content="Access control conditions for this DECK" placement="right" touch={false}>
        <button className="flex items-center w-full px-6 py-1 text-left" onClick={onClick}>
          <IconShare className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
          <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">Share DECK</span>
        </button>
      </Tooltip>
    </SidebarItem>
  );
};

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
          <Link href={`/app/${deckId}/graph`}>
            <a className="flex items-center px-6 py-1">
              <IconAffiliate className="flex-shrink-0 mr-1 text-gray-800 dark:text-gray-300" size={20} />
              <span className="overflow-x-hidden select-none overflow-ellipsis whitespace-nowrap">Graph View</span>
            </a>
          </Link>
        </span>
      </Tooltip>
    </SidebarItem>
  );
};

export default memo(Sidebar);
