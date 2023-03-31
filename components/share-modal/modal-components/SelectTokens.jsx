import React, { useState } from 'react';
import { utils } from 'ethers';
import LitJsSdk from 'lit-js-sdk';
import { IconX } from '@tabler/icons';
import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';
import TokenSelect from '../TokenSelect';

const SelectTokens = ({ setActiveStep, processingAccess, onAccessControlConditionsSelected, tokenList }) => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [chain, setChain] = useState(null);
  const [contractType, setContractType] = useState('ERC721');
  const [erc1155TokenId, setErc1155TokenId] = useState('');

  const handleSubmit = async () => {
    let success;

    if (contractAddress && contractAddress.length) {
      let accessControlConditions;

      if (contractType === 'ERC20') {
        let decimals = 0;
        try {
          decimals = await LitJsSdk.decimalPlaces({
            chain: chain.value,
            contractAddress: contractAddress,
          });
        } catch (e) {
          console.log(e);
        }
        console.log(`decimals`, decimals);
        const amountInBaseUnit = utils.parseUnits(amount, decimals);
        accessControlConditions = [
          {
            contractAddress: contractAddress,
            standardContractType: contractType,
            chain: chain.value,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '>=',
              value: amountInBaseUnit.toString(),
            },
          },
        ];
      } else if (contractType === 'ERC721') {
        accessControlConditions = [
          {
            contractAddress: contractAddress,
            standardContractType: contractType,
            chain: chain.value,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '>=',
              value: amount.toString(),
            },
          },
        ];
      } else if (contractType === 'ERC1155') {
        accessControlConditions = [
          {
            contractAddress: contractAddress,
            standardContractType: contractType,
            chain: chain.value,
            method: 'balanceOf',
            parameters: [':userAddress', erc1155TokenId],
            returnValueTest: {
              comparator: '>=',
              value: amount.toString(),
            },
          },
        ];
      }
      console.log('accessControlConditions contract', accessControlConditions);
      success = await onAccessControlConditionsSelected(accessControlConditions);
    } else if (selectedToken && selectedToken.value === 'ethereum') {
      // ethereum
      const amountInWei = utils.parseEther(amount);
      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: chain.value,
          method: 'eth_getBalance',
          parameters: [':userAddress', 'latest'],
          returnValueTest: {
            comparator: '>=',
            value: amountInWei.toString(),
          },
        },
      ];
      console.log('accessControlConditions token', accessControlConditions);
      success = await onAccessControlConditionsSelected(accessControlConditions);
    } else {
      console.log('selectedToken', selectedToken);

      let tokenType;
      if (selectedToken && selectedToken.standard?.toLowerCase() === 'erc721') {
        tokenType = 'erc721';
      } else if (selectedToken && selectedToken.decimals) {
        tokenType = 'erc20';
      } else {
        // if we don't already know the type, try and get decimal places.  if we get back 0 or the request fails then it's probably erc721.
        let decimals = 0;
        try {
          decimals = await LitJsSdk.decimalPlaces({
            contractAddress: selectedToken.value,
          });
        } catch (e) {
          console.log(e);
        }
        if (decimals == 0) {
          tokenType = 'erc721';
        } else {
          tokenType = 'erc20';
        }
      }

      console.log('tokenType is', tokenType);

      if (tokenType == 'erc721') {
        // erc721
        const accessControlConditions = [
          {
            contractAddress: selectedToken.value,
            standardContractType: 'ERC721',
            chain: chain.value,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '>=',
              value: amount.toString(),
            },
          },
        ];
        console.log('accessControlConditions typeerc721', accessControlConditions);
        success = await onAccessControlConditionsSelected(accessControlConditions);
      } else {
        // erc20 token
        let amountInBaseUnit;
        if (selectedToken.decimals) {
          amountInBaseUnit = utils.parseUnits(amount, selectedToken.decimals);
        } else {
          // need to check the contract for decimals
          // this will auto switch the chain to the selected one in metamask
          let decimals = 0;
          try {
            decimals = await LitJsSdk.decimalPlaces({
              contractAddress: selectedToken.value,
            });
          } catch (e) {
            console.log(e);
          }
          console.log(`decimals in ${selectedToken.value}`, decimals);
          amountInBaseUnit = utils.parseUnits(amount, decimals);
        }
        const accessControlConditions = [
          {
            contractAddress: selectedToken.value,
            standardContractType: 'ERC20',
            chain: chain.value,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '>=',
              value: amountInBaseUnit.toString(),
            },
          },
        ];
        console.log('accessControlConditions else', accessControlConditions);
        success = await onAccessControlConditionsSelected(accessControlConditions);
      }
    }

    if (success) {
      setActiveStep('accessCreated');
    }
  };

  return (
    <div>
      <h4 className="text-lg font-heading tracking-wide">Which wallet(s) should be granted access?</h4>
      <div className="mt-4">
        <div>
          <div>
            <label>Select blockchain to check requirements against</label>
            <ChainSelector chain={chain} setChain={setChain} />
          </div>
        </div>
        <div className="mt-4">
          <label>Select token/NFT or enter contract address</label>
          <div className="flex items-center">
            {(!contractAddress || !contractAddress.length) && !selectedToken && (
              <span className="flex items-center">
                <TokenSelect tokenList={tokenList} onSelect={setSelectedToken} />
                <div className="mx-4">OR</div>
              </span>
            )}
            {!selectedToken && (
              <InputWrapper
                placeholder="Enter contract address"
                className="w-1/2"
                value={contractAddress}
                id="amount"
                autoFocus
                clearable={contractAddress}
                onClear={() => setContractAddress('')}
                handleChange={v => setContractAddress(v)}
              />
            )}
            {!!selectedToken && !contractAddress && !contractAddress.length && (
              <div className="flex items-center border px-2 py-2">
                <div
                  className="w-4 h-4 rounded-full bg-no-repeat bg-contain bg-center mr-1"
                  style={{
                    backgroundImage: `url(${selectedToken.logo})` ?? undefined,
                  }}
                />
                <div className="mr-4">{selectedToken.symbol}</div>
                <button onClick={() => setSelectedToken(null)}>
                  <IconX size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {!selectedToken && !!contractAddress && contractAddress.length && (
          <div className="mt-4">
            <fieldset>
              <div className="flex space-x-4">
                <legend>Token contract type:</legend>
                <div className="form-check form-check-inline">
                  <input
                    className="form-radio appearance-none rounded-full h-4 w-4 border border-gray-300 bg-white text-primary-500 checked:bg-primary-500 checked:border-primary-500 focus:outline-none mt-1 align-top bg-no-repeat bg-center bg-contain mr-2 cursor-pointer"
                    type="radio"
                    name="contractType"
                    id="ERC20"
                    value="ERC20"
                    checked={contractType === 'ERC20'}
                    onChange={e => setContractType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="ERC20">
                    ERC20
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-radio appearance-none rounded-full h-4 w-4 border border-gray-300 bg-white text-primary-500 checked:bg-primary-500 checked:border-primary-500 focus:outline-none mt-1 align-top bg-no-repeat bg-center bg-contain mr-2 cursor-pointer"
                    type="radio"
                    name="contractType"
                    id="ERC721"
                    value="ERC721"
                    checked={contractType === 'ERC721'}
                    onChange={e => setContractType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="ERC721">
                    ERC721
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-radio appearance-none rounded-full h-4 w-4 border border-gray-300 bg-white text-primary-500 checked:bg-primary-500 checked:border-primary-500 focus:outline-none mt-1 align-top bg-no-repeat bg-center bg-contain mr-2 cursor-pointer"
                    type="radio"
                    name="contractType"
                    id="ERC1155"
                    value="ERC1155"
                    checked={contractType === 'ERC1155'}
                    onChange={e => setContractType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="ERC1155">
                    ERC1155
                  </label>
                </div>
              </div>
            </fieldset>

            {contractType === 'ERC1155' ? (
              <div>
                <InputWrapper
                  value={erc1155TokenId}
                  label="ERC1155 Token Id"
                  id="erc1155TokenId"
                  size="m"
                  handleChange={value => setErc1155TokenId(value)}
                />
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-4">
          <InputWrapper
            value={amount}
            label="How many tokens does the wallet need to own?"
            id="amount"
            autoFocus
            handleChange={value => setAmount(value)}
          />
        </div>
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: processingAccess ? 'Processing...' : 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !amount || !(selectedToken || contractAddress) || !chain || processingAccess,
          loading: processingAccess,
        }}
      />
    </div>
  );
};

export default SelectTokens;
