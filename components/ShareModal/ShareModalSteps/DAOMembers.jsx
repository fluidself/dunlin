import React, { useState } from 'react';
import InputWrapper from '../InputWrapper';
import ChainSelector from '../ChainSelector';
import Navigation from '../Navigation';

const DAOMembers = ({ setActiveStep, processingAccess, onAccessControlConditionsSelected }) => {
  const [DAOAddress, setDAOAddress] = useState('');
  const [chain, setChain] = useState(null);

  const handleSubmit = async () => {
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
    const success = await onAccessControlConditionsSelected(accessControlConditions);

    if (success) {
      setActiveStep('accessCreated');
    }
  };

  return (
    <div>
      <h4 className="text-lg">Which DAO&apos;s members should be granted access?</h4>
      <div className="mt-4">
        <div className="mt-4">
          <label>Select blockchain to check requirements against</label>
          <ChainSelector chain={chain} setChain={setChain} />
        </div>

        <div className="mt-4">
          <InputWrapper
            value={DAOAddress}
            label="Enter DAO contract address"
            id="DAOAddress"
            autoFocus
            size="m"
            handleChange={value => setDAOAddress(value)}
          />
        </div>
      </div>
      <span className="mt-4 text-sm block">DAOs using the MolochDAOv2.1 contract (includes DAOhaus) are supported</span>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: processingAccess ? 'Processing...' : 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !DAOAddress || !chain || processingAccess,
          loading: processingAccess,
        }}
      />
    </div>
  );
};

export default DAOMembers;
