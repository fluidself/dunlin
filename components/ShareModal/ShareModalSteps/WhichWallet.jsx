import React, { useState } from 'react';
import LitJsSdk from 'lit-js-sdk';
import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';

const WhichWallet = ({ setActiveStep, onAccessControlConditionsSelected, setError }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [chain, setChain] = useState(null);

  const handleSubmit = async () => {
    let resolvedAddress = walletAddress;
    if (walletAddress.includes('.')) {
      // do domain name lookup
      resolvedAddress = await LitJsSdk.lookupNameServiceAddress({
        chain: chain.value,
        name: walletAddress,
      });
      if (!resolvedAddress) {
        console.log('failed to resolve ENS address');
        setError({
          title: 'Could not resolve ENS address',
          details: 'Try another wallet address',
        });
        return;
      }
    }
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: chain.value,
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: resolvedAddress,
        },
      },
    ];
    onAccessControlConditionsSelected(accessControlConditions);
    setActiveStep('accessCreated');
  };

  return (
    <div>
      <div>
        <h4 className="text-lg">Which wallet should be granted access?</h4>
        <a className="underline cursor-pointer hover:text-offWhite" onClick={() => setActiveStep('assetWallet')}>
          Grant Access on NFT Ownership
        </a>
      </div>
      <div className="mt-4">
        <div>
          <label>Select blockchain</label>
          <ChainSelector chain={chain} setChain={setChain} />
        </div>
        <InputWrapper
          value={walletAddress}
          className="mt-4"
          label="Add Wallet Address or Blockchain Domain (e.g. ENS, UNS) here:"
          id="walletAddress"
          autoFocus
          handleChange={value => setWalletAddress(value)}
        />
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !walletAddress || !chain,
        }}
      />
    </div>
  );
};

export default WhichWallet;
