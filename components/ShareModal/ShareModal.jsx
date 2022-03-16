import React, { useState, useEffect } from 'react';
import { IconX } from '@tabler/icons';
import { toast } from 'react-toastify';
import LitJsSdk from 'lit-js-sdk';

import {
  WhatToDo,
  AbleToAccess,
  WhichWallet,
  AssetWallet,
  DAOMembers,
  AccessCreated,
  SelectTokens,
  ChoosePOAP,
} from './ShareModalSteps';
import UnsavedPopup from './UnsavedPopup';

const ModalComponents = {
  whatToDo: WhatToDo,
  ableToAccess: AbleToAccess,
  whichWallet: WhichWallet,
  assetWallet: AssetWallet,
  DAOMembers: DAOMembers,
  accessCreated: AccessCreated,
  selectTokens: SelectTokens,
  choosePOAP: ChoosePOAP,
};

const ShareModal = props => {
  const {
    onClose = () => false,
    onBack = () => false,
    sharingItems = [],
    showStep,
    onStringProvided,
    onAccessControlConditionsSelected,
    getSharingLink,
    onlyAllowCopySharingLink,
    copyLinkText,
    myWalletAddress,
  } = props;

  const [activeStep, setActiveStep] = useState(showStep || 'whatToDo');
  const [tokenList, setTokenList] = useState([]);
  const [requirementCreated, setRequirementCreated] = useState(false);
  const [error, setError] = useState(null);
  const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);

  useEffect(() => {
    const getTokens = async () => {
      // get token list and cache it
      const tokens = await LitJsSdk.getTokenList();
      setTokenList(tokens);
    };

    getTokens();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(`${error.title} - ${error.details}`);
    }
  }, [error]);

  const copyToClipboard = async () => {
    const fileUrl = getSharingLink(sharingItems[0]);
    await navigator.clipboard.writeText(fileUrl);

    toast.success('Copied!');
  };

  let totalAccessControlConditions = 1;
  if (sharingItems.length === 1) {
    if (sharingItems[0].additionalAccessControlConditions) {
      totalAccessControlConditions += sharingItems[0].additionalAccessControlConditions.length;
    }
  }

  const ModalComponent = props => {
    const { type } = props;

    let Component = ModalComponents[type];

    return (
      <Component
        {...props}
        onMainBack={onBack}
        sharingItems={sharingItems}
        copyToClipboard={copyToClipboard}
        onStringProvided={onStringProvided}
        onAccessControlConditionsSelected={onAccessControlConditionsSelected}
        tokenList={tokenList}
        onlyAllowCopySharingLink={onlyAllowCopySharingLink}
        copyLinkText={copyLinkText}
        setRequirementCreated={setRequirementCreated}
        requirementCreated={requirementCreated}
        setError={setError}
        myWalletAddress={myWalletAddress}
      />
    );
  };

  let title = '';
  if (sharingItems.length > 0) {
    title = sharingItems.length > 1 ? `${sharingItems.length} Files` : `${sharingItems.length} File` ?? '';
  }

  const handleClose = () => {
    if (!['whatToDo', 'ableToAccess'].includes(activeStep)) {
      setShowUnsavedPopup(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={handleClose} />
      <div className="flex items-center justify-center h-screen p-6">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-background border border-gray-500 sm:max-h-[540px] sm:w-[740px] py-2 px-4">
          <div className="flex flex-row justify-between items-center">
            <span>{title}</span>
            <button onClick={handleClose} className="mr-[-4px]">
              <IconX size={20} />
            </button>
          </div>
          <div className="mt-4">
            <div className="w-[654px]">
              <ModalComponent type={activeStep} setActiveStep={setActiveStep} />
            </div>
            <UnsavedPopup open={showUnsavedPopup} onClose={onClose} onCancel={() => setShowUnsavedPopup(false)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
