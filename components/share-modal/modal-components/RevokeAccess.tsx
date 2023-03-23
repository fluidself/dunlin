import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-toastify';
import { encryptWithLit } from 'utils/encryption';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import { useStore } from 'lib/store';
import supabase from 'lib/supabase';
import { Deck } from 'types/supabase';
import Navigation from '../Navigation';

type Props = {
  setActiveStep: Dispatch<SetStateAction<string>>;
  onClose: () => void;
};

const RevokeAccess = (props: Props) => {
  const { setActiveStep, onClose } = props;
  const { id: deckId, key, deck_name } = useCurrentDeck();
  const { user } = useAuth();
  const setCollaborativeDeck = useStore(state => state.setCollaborativeDeck);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setProcessing(true);

    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: user.id,
        },
      },
    ];
    const [encryptedStringBase64, encryptedSymmetricKeyBase64] = await encryptWithLit(key, accessControlConditions);
    const accessParams = {
      encrypted_string: encryptedStringBase64,
      encrypted_symmetric_key: encryptedSymmetricKeyBase64,
      access_control_conditions: accessControlConditions,
    };

    const { data, error } = await supabase
      .from<Deck>('decks')
      .update({ access_params: accessParams })
      .eq('id', deckId)
      .single();
    if (!data || error) {
      toast.error('Revoking access failed.');
    }

    await setCollaborativeDeck(false);

    toast.success('Workspace access was revoked');
    setProcessing(false);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div>
      <div className="text-lg">Revoke all workspace access</div>
      <div className="flex space-x-4 items-center">
        <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
          {deck_name}
        </span>
        <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
          {deckId}
        </span>
      </div>
      <div className="mt-4">
        <p>After revoking access, only you will be able to use this workspace.</p>
      </div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: processing ? 'Processing...' : 'Revoke Access',
          onClick: handleSubmit,
          withoutIcon: true,
          disabled: processing,
          loading: processing,
        }}
      />
    </div>
  );
};

export default RevokeAccess;
