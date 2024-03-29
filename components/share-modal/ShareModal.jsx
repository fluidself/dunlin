import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IconX } from '@tabler/icons';
import { toast } from 'react-toastify';
import useHotkeys from 'utils/useHotkeys';
import {
  AbleToAccess,
  CurrentAccess,
  RevokeAccess,
  WhichWallet,
  AssetWallet,
  DAOMembers,
  AccessCreated,
  SelectTokens,
  ChoosePOAP,
  ProofOfHumanity,
  OpenAccess,
} from './modal-components';
import UnsavedPopup from './UnsavedPopup';

const ModalComponents = {
  ableToAccess: AbleToAccess,
  currentAccess: CurrentAccess,
  revokeAccess: RevokeAccess,
  whichWallet: WhichWallet,
  assetWallet: AssetWallet,
  DAOMembers: DAOMembers,
  selectTokens: SelectTokens,
  choosePOAP: ChoosePOAP,
  proofOfHumanity: ProofOfHumanity,
  openAccess: OpenAccess,
  accessCreated: AccessCreated,
};

export default function ShareModal(props) {
  const {
    onClose = () => false,
    showStep,
    deckToShare = '',
    processingAccess,
    onAccessControlConditionsSelected,
  } = props;

  const [activeStep, setActiveStep] = useState(showStep || 'ableToAccess');
  const [tokenList, setTokenList] = useState([]);
  const [error, setError] = useState(null);
  const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);

  useEffect(() => {
    const getTokens = async () => {
      const erc20Promise = fetch('https://tokens.coingecko.com/uniswap/all.json').then(r => r.json());
      const erc721Promise = fetch(
        'https://raw.githubusercontent.com/0xsequence/token-directory/main/index/mainnet/erc721.json',
      ).then(r => r.json());
      const [erc20s, erc721s] = await Promise.all([erc20Promise, erc721Promise]);
      const sorted = [...erc20s.tokens, ...erc721s.tokens].sort((a, b) => (a.name > b.name ? 1 : -1));
      setTokenList(sorted);
    };

    getTokens();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(`${error.title} - ${error.details}`);
    }
  }, [error]);

  const ModalComponent = props => {
    const { type } = props;

    let Component = ModalComponents[type];

    return (
      <Component
        {...props}
        deckToShare={deckToShare}
        processingAccess={processingAccess}
        onAccessControlConditionsSelected={onAccessControlConditionsSelected}
        tokenList={tokenList}
        setError={setError}
        onClose={onClose}
      />
    );
  };

  const handleClose = useCallback(() => {
    if (!['ableToAccess', 'currentAccess', 'revokeAccess', 'accessCreated'].includes(activeStep)) {
      setShowUnsavedPopup(true);
    } else {
      onClose();
    }
  }, [setShowUnsavedPopup, activeStep, onClose]);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => handleClose(),
      },
    ],
    [handleClose],
  );
  useHotkeys(hotkeys);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={handleClose} />
      <div className="flex items-center justify-center h-screen p-6">
        <div className="z-30 flex flex-col w-full h-full max-w-full bg-white dark:bg-gray-900 border dark:border-gray-600 shadow-popover overflow-x-hidden overflow-y-scroll no-scrollbar rounded sm:max-h-[540px] sm:w-[740px] py-2 px-4 dark:text-gray-100">
          <div className="flex flex-row justify-end items-center">
            <button
              onClick={handleClose}
              className="mr-[-4px] text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <IconX size={20} />
            </button>
          </div>
          <div className="mt-4">
            <div className="w-[654px] mx-auto">
              <ModalComponent type={activeStep} setActiveStep={setActiveStep} />
            </div>
            <UnsavedPopup open={showUnsavedPopup} onClose={onClose} onCancel={() => setShowUnsavedPopup(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
