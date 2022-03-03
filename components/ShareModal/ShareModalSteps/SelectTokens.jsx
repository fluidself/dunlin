import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LitJsSdk from 'lit-js-sdk';
import { IconButton, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { Close } from '@mui/icons-material';

import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';
import TokenSelect from '../TokenSelect';

const SelectTokens = ({ setActiveStep, onAccessControlConditionsSelected, tokenList }) => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [chain, setChain] = useState(null);
  const [contractType, setContractType] = useState('ERC721');
  const [erc1155TokenId, setErc1155TokenId] = useState('');

  // useEffect(() => {
  //   console.log('CHECK SELECTED', selectedToken)
  //   console.log('CONTRACT ADDRESS', contractAddress)
  // }, [selectedToken, contractAddress])

  const handleSubmit = async () => {
    console.log('handleSubmit and selectedToken is', selectedToken);

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
        const amountInBaseUnit = ethers.utils.parseUnits(amount, decimals);
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
      onAccessControlConditionsSelected(accessControlConditions);
    } else if (selectedToken && selectedToken.value === 'ethereum') {
      // ethereum
      const amountInWei = ethers.utils.parseEther(amount);
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
      onAccessControlConditionsSelected(accessControlConditions);
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
        onAccessControlConditionsSelected(accessControlConditions);
      } else {
        // erc20 token
        let amountInBaseUnit;
        if (selectedToken.decimals) {
          amountInBaseUnit = ethers.utils.parseUnits(amount, selectedToken.decimals);
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
          amountInBaseUnit = ethers.utils.parseUnits(amount, decimals);
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
        onAccessControlConditionsSelected(accessControlConditions);
      }
    }
    setActiveStep('accessCreated');
  };

  const handleChangeContractType = event => {
    setContractType(event.target.value);
  };

  console.log('chain', chain);

  return (
    <div>
      <h4 className="text-lg">Which wallet should be able to access this asset?</h4>
      <div className="mt-4">
        <div>
          <div>
            <label>Select blockchain to check requirements against:</label>
            <ChainSelector chain={chain} setChain={setChain} />
          </div>
        </div>
        <div className="mt-4">
          <label>Select token/NFT or enter contract address: </label>
          <div className="flex items-center">
            {(!contractAddress || !contractAddress.length) && !selectedToken && (
              <span className="flex items-center">
                <TokenSelect tokenList={tokenList} onSelect={setSelectedToken} />
                <div className="mx-4">OR</div>
              </span>
            )}
            {!selectedToken && (
              <InputWrapper
                placeholder="ERC20 or ERC721 or ERC1155 address"
                value={contractAddress}
                id="amount"
                autoFocus
                size="m"
                handleChange={v => setContractAddress(v)}
              />
            )}
            {!selectedToken && !!contractAddress && contractAddress.length && (
              <IconButton size={'small'} onClick={() => setContractAddress('')}>
                <Close />
              </IconButton>
            )}
            {!!selectedToken && !contractAddress && !contractAddress.length && (
              <div className="flex items-center border pl-2">
                <div
                  className="w-4 h-4 rounded-full bg-no-repeat bg-contain bg-center mr-1"
                  style={{
                    backgroundImage: `url(${selectedToken.logo})` ?? undefined,
                  }}
                />
                <div className="mr-4">{selectedToken.symbol}</div>
                <IconButton size={'small'} onClick={() => setSelectedToken(null)}>
                  <Close />
                </IconButton>
              </div>
            )}
          </div>
        </div>

        {!selectedToken && !!contractAddress && contractAddress.length && (
          <div className="mt-4">
            <FormControl>
              <FormLabel id="demo-row-radio-buttons-group-label">Token contract type</FormLabel>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                value={contractType}
                onChange={handleChangeContractType}
              >
                <FormControlLabel value="ERC20" control={<Radio />} label="ERC20" />
                <FormControlLabel value="ERC721" control={<Radio />} label="ERC721" />
                <FormControlLabel value="ERC1155" control={<Radio />} label="ERC1155" />
              </RadioGroup>
            </FormControl>

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
            {/* <label>Token contract type</label>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>ERC20</Typography>
              <Switch
                checked={contractType === "ERC721"}
                onChange={handleChangeContractType}
              />
              <Typography>ERC721 (NFT)</Typography>
            </Stack> */}
          </div>
        )}

        <div className="mt-4">
          <InputWrapper
            value={amount}
            label="How many tokens does the wallet need to own?"
            id="amount"
            autoFocus
            size="m"
            handleChange={value => setAmount(value)}
          />
        </div>
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !amount || !(selectedToken || contractAddress) || !chain,
        }}
      />
    </div>
  );
};

export default SelectTokens;
