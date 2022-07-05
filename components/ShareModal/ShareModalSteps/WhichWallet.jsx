import React, { useState } from 'react';
import LitJsSdk from 'lit-js-sdk';
import Button from 'components/home/Button';
import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';

const VALID_INPUT_REGEX = /(0x[a-fA-F0-9]{40}$|.*\.eth$)/;
const ENS_REGEX = /^.*\.eth$/;

const WhichWallet = ({ setActiveStep, processingAccess, onAccessControlConditionsSelected, setError }) => {
  const [walletAddresses, setWalletAddresses] = useState([{ value: '', error: '' }]);
  const [chain, setChain] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleInputChange = (index, value) => {
    let data = [...walletAddresses];
    data[index].value = value;
    setWalletAddresses(data);
  };

  const insertAddressField = () => {
    const newField = { value: '', error: '' };
    setWalletAddresses([...walletAddresses, newField]);
  };

  const hasValidInput = () => {
    let isValid = true;
    for (let i = 0; i < walletAddresses.length; i++) {
      if (!VALID_INPUT_REGEX.test(walletAddresses[i].value)) {
        let data = [...walletAddresses];
        data[i].error = 'Invalid input';
        setWalletAddresses(data);
        isValid = false;
      }
    }
    return isValid;
  };

  const resolveEnsDomains = async () => {
    const result = { resolved: false, addresses: [] };

    for (let i = 0; i < walletAddresses.length; i++) {
      if (ENS_REGEX.test(walletAddresses[i].value)) {
        const resolvedAddress = await LitJsSdk.lookupNameServiceAddress({
          chain: chain.value,
          name: walletAddresses[i].value,
        });
        if (!resolvedAddress) {
          const data = [...walletAddresses];
          data[i].error = 'Could not resolve ENS address';
          setWalletAddresses(data);
          setError({
            title: 'Could not resolve ENS address',
            details: 'Try another wallet address',
          });
        }
        result.addresses.push(resolvedAddress);
      } else {
        result.addresses.push(walletAddresses[i].value);
      }
    }
    result.resolved = true;
    return result;
  };

  const handleSubmit = async () => {
    setProcessing(true);

    if (!hasValidInput()) return;
    const ensResolveResult = await resolveEnsDomains();
    if (!ensResolveResult.resolved) return;

    const accessControlConditions = [];
    ensResolveResult.addresses.forEach((address, index) => {
      if (index > 0) accessControlConditions.push({ operator: 'or' });
      accessControlConditions.push({
        contractAddress: '',
        standardContractType: '',
        chain: chain.value,
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: address,
        },
      });
    });

    setProcessing(false);
    const success = await onAccessControlConditionsSelected(accessControlConditions);
    if (success) {
      setActiveStep('accessCreated');
    }
  };

  return (
    <div>
      <div>
        <h4 className="text-lg">Which wallet(s) should be granted access?</h4>
        <a className="underline cursor-pointer hover:text-gray-300" onClick={() => setActiveStep('assetWallet')}>
          Grant Access on NFT Ownership
        </a>
      </div>
      <div className="mt-4">
        <div>
          <label>Select blockchain</label>
          <ChainSelector chain={chain} setChain={setChain} />
        </div>
        {walletAddresses.map((field, index) => (
          <InputWrapper
            key={index}
            value={field.value}
            className="mt-4"
            label="Add Wallet Address or ENS Domain"
            id={`walletAddress-${index}`}
            autoFocus={index === 0}
            handleChange={value => handleInputChange(index, value)}
            error={field.error}
          />
        ))}
        {walletAddresses[0].value && (
          <Button className="mt-2" onClick={insertAddressField} disabled={processing || processingAccess}>
            Add another
          </Button>
        )}
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: processingAccess || processing ? 'Processing...' : 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !walletAddresses[0].value || !chain || processingAccess || processing,
          loading: processingAccess || processing,
        }}
      />
    </div>
  );
};

export default WhichWallet;
