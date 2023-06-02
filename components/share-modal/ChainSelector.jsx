import React, { useMemo, useEffect } from 'react';
import Select from 'react-select';
import { LIT_CHAINS } from '@lit-protocol/constants';

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
      Object.keys(LIT_CHAINS).map(item => {
        return {
          label: LIT_CHAINS[item].name,
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
