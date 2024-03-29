import React, { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Select from 'react-select';
import { AccessControlCondition } from 'types/lit';
import InputWrapper from '../InputWrapper';
import Navigation from '../Navigation';

const matchConditionOptions = [
  {
    label: 'Equals POAP Name exactly',
    id: 'equals',
    value: '=',
  },
  {
    label: 'Contains POAP Name',
    id: 'contains',
    value: 'contains',
  },
];

type MatchConditionOption = {
  label: string;
  id: string;
  value: string;
};

type Props = {
  onAccessControlConditionsSelected: (acc: AccessControlCondition[]) => boolean;
  setActiveStep: Dispatch<SetStateAction<string>>;
  processingAccess: boolean;
};

export default function ChoosePOAP({ setActiveStep, processingAccess, onAccessControlConditionsSelected }: Props) {
  const [POAPName, setPOAPName] = useState('');
  const [matchCondition, setMatchCondition] = useState<MatchConditionOption | null>(null);

  const handleSubmit = async () => {
    if (!matchCondition?.value) return;

    const chain = 'xdai';
    const accessControlConditions = [
      {
        contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
        standardContractType: 'ERC721',
        chain,
        method: 'balanceOf',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>',
          value: '0',
        },
      },
      {
        contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
        standardContractType: 'POAP',
        chain,
        method: 'tokenURI',
        parameters: [],
        returnValueTest: {
          comparator: matchCondition.value,
          value: POAPName,
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
      <h4 className="text-lg font-heading tracking-wide">Which POAP should be granted access?</h4>
      <div className="mt-8">
        <InputWrapper
          value={POAPName}
          label="POAP Name"
          id="POAPName"
          autoFocus
          handleChange={(value: string) => setPOAPName(value)}
        />
        <div className="mt-4">
          <label>Match Conditions</label>
          <Select
            className="react-select-container mt-1"
            classNamePrefix="react-select"
            placeholder="Select one..."
            isClearable
            options={matchConditionOptions}
            value={matchCondition}
            onChange={value => setMatchCondition(value)}
          />
        </div>
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: processingAccess ? 'Processing...' : 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: !POAPName || !matchCondition || processingAccess,
          loading: processingAccess,
        }}
      />
    </div>
  );
}
