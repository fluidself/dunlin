import React from 'react';
import { IconLock } from '@tabler/icons';

const WhatToDo = ({ setActiveStep, sharingItems, onlyAllowCopySharingLink, copyToClipboard, copyLinkText }) => {
  return (
    <div>
      <div>
        <h3 className="text-xl">What would you like to do?</h3>
      </div>
      <div className="flex flex-wrap justify-center w-full">
        {!onlyAllowCopySharingLink ? (
          <div className="mt-8 py-4 w-full border border-white cursor-pointer" onClick={() => setActiveStep('ableToAccess')}>
            <h4 className="text-center">Create Requirement</h4>
            <div className="flex justify-center items-center flex-col box-border">
              <IconLock size={64} />
              <div>Lock this content with an existing token, NFT, or contract</div>
            </div>
          </div>
        ) : null}

        {sharingItems.length === 1 && (sharingItems[0].accessControlConditions || onlyAllowCopySharingLink) ? (
          <div className="mt-1 w-full border border-white cursor-pointer" onClick={() => copyToClipboard()}>
            <h4>Share</h4>
            <div className="border border-white flex justify-center items-center flex-col box-border">
              <div>
                <a className="underline">Click to copy link.</a> <br />
                {copyLinkText || 'Only authorized wallets can open the file'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WhatToDo;
