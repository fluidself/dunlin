import React, { useState } from 'react';
import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';

const DAOMembers = ({ setActiveStep, onAccessControlConditionsSelected }) => {
  const [DAOAddress, setDAOAddress] = useState('');
  const [chain, setChain] = useState(null);

  const handleSubmit = () => {
    const accessControlConditions = [
      {
        contractAddress: DAOAddress,
        standardContractType: 'MolochDAOv2.1',
        chain: chain.value,
        method: 'members',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: 'true',
        },
      },
    ];
    onAccessControlConditionsSelected(accessControlConditions);
    setActiveStep('accessCreated');
  };

  return (
    <div>
      <h4 className="text-lg">Which DAO’s members should be able to access this asset?</h4>
      <div className="mt-4">
        <div className="mt-4">
          <label>Select blockchain to check requirements against:</label>
          <ChainSelector chain={chain} setChain={setChain} />
        </div>

        <div className="mt-4">
          <InputWrapper
            value={DAOAddress}
            label="Add DAO contract address"
            id="DAOAddress"
            autoFocus
            size="m"
            handleChange={value => setDAOAddress(value)}
          />
        </div>
      </div>
      <span className="mt-4 text-sm block">
        Lit Gateway currently supports DAOs using the MolochDAOv2.1 contract (includes DAOhaus){' '}
      </span>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !DAOAddress || !chain,
        }}
      />
    </div>
  );
};

export default DAOMembers;
