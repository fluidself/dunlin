import React, { useState, useMemo } from 'react';
import Creatable from 'react-select/creatable';
import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';

const AssetWallet = ({ setActiveStep, onAccessControlConditionsSelected, tokenList }) => {
  const [tokenId, setTokenId] = useState('');
  const [chain, setChain] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  const tokenSelectBoxRows = useMemo(() => {
    return tokenList
      .filter(t => t.standard?.toLowerCase() === 'erc721')
      .map(t => ({
        label: t.name,
        value: t.address,
      }));
  }, [tokenList]);

  const handleSubmit = () => {
    const accessControlConditions = [
      {
        contractAddress: selectedToken.value,
        standardContractType: 'ERC721',
        chain: chain.value,
        method: 'ownerOf',
        parameters: [tokenId],
        returnValueTest: {
          comparator: '=',
          value: ':userAddress',
        },
      },
    ];
    onAccessControlConditionsSelected(accessControlConditions);
    setActiveStep('accessCreated');
  };

  return (
    <div>
      <div>
        <h4>Which asset does a wallet need to own to access this?</h4>
        <a className="underline cursor-pointer hover:text-offWhite" onClick={() => setActiveStep('whichWallet')}>
          Grant Access to Wallet or Blockchain Domain
        </a>
      </div>
      <div className="mt-4">
        <div className="mt-4">
          <label className="mt-4">Select blockchain</label>
          <ChainSelector chain={chain} setChain={setChain} />
        </div>
        <div className="mt-4">
          <label className="mt-4">Select token or enter contract address</label>
          <Creatable
            isClearable
            isSearchable
            defaultValue={''}
            className="react-select-container"
            classNamePrefix="react-select"
            options={tokenSelectBoxRows}
            onChange={value => setSelectedToken(value)}
          />
        </div>
        <InputWrapper
          value={tokenId}
          className="mt-4"
          label="Add Token ID"
          id="tokenId"
          size="m"
          handleChange={value => setTokenId(value)}
        />
      </div>
      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !tokenId || !chain,
        }}
      />
    </div>
  );
};

export default AssetWallet;
