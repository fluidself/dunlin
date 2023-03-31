import type { Dispatch, SetStateAction } from 'react';
import { AccessControlCondition } from 'types/lit';
import Navigation from '../Navigation';

type Props = {
  onAccessControlConditionsSelected: (acc: AccessControlCondition[]) => boolean;
  setActiveStep: Dispatch<SetStateAction<string>>;
  processingAccess: boolean;
};

const OpenAccess = (props: Props) => {
  const { onAccessControlConditionsSelected, setActiveStep, processingAccess } = props;

  const handleSubmit = async () => {
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: 'eth_getBalance',
        parameters: [':userAddress', 'latest'],
        returnValueTest: {
          comparator: '>=',
          value: '0',
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
      <h4 className="text-lg font-heading tracking-wide">Grant all users access?</h4>
      <div className="mt-4">
        <p>Anyone with an Ethereum address will be able to access the workspace.</p>
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: processingAccess ? 'Processing...' : 'Create Requirement',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: processingAccess,
          loading: processingAccess,
        }}
      />
    </div>
  );
};

export default OpenAccess;
