import type { Dispatch, SetStateAction } from 'react';
import { AccessControlCondition } from 'types/lit';
import Navigation from '../Navigation';

type Props = {
  onAccessControlConditionsSelected: (acc: AccessControlCondition[]) => boolean;
  setActiveStep: Dispatch<SetStateAction<string>>;
  processingAccess: boolean;
};

const ProofOfHumanity = (props: Props) => {
  const { onAccessControlConditionsSelected, setActiveStep, processingAccess } = props;

  const handleSubmit = async () => {
    const accessControlConditions = [
      {
        contractAddress: '0xC5E9dDebb09Cd64DfaCab4011A0D5cEDaf7c9BDb',
        standardContractType: 'ProofOfHumanity',
        chain: 'ethereum',
        method: 'isRegistered',
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
      <div className="text-lg">Grant Proof of Humanity users access?</div>
      <div className="mt-4">
        <p>
          Any user who is registered with the{' '}
          <a
            href="https://www.proofofhumanity.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary-400"
          >
            Proof Of Humanity
          </a>{' '}
          protocol will be able to access the workspace.
        </p>
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

export default ProofOfHumanity;
