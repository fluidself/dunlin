import React, { useMemo, useEffect } from 'react';
import Select from 'react-select';
import LitJsSdk from 'lit-js-sdk';

const ChainSelector = ({ chain, setChain }) => {
  // Set Ethereum as default
  useEffect(
    () =>
      setChain({
        label: 'Ethereum',
        id: 'ethereum',
        value: 'ethereum',
      }),
    [setChain],
  );

  const chainOptions = useMemo(
    () =>
      Object.keys(LitJsSdk.LIT_CHAINS).map(item => {
        return {
          label: LitJsSdk.LIT_CHAINS[item].name,
          id: item,
          value: item,
        };
      }),
    [],
  );

  return (
    <Select
      className="react-select-container mt-1"
      classNamePrefix="react-select"
      placeholder="Select a blockchain"
      isClearable
      options={chainOptions}
      value={chain}
      onChange={value => setChain(value)}
    />
  );
};

export default ChainSelector;
