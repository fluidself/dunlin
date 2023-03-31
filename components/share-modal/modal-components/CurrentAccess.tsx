import LitJsSdk from 'lit-js-sdk';
import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import supabase from 'lib/supabase';
import { Deck } from 'types/supabase';
import { AccessControlCondition } from 'types/lit';
import Navigation from '../Navigation';

type Props = {
  setActiveStep: Dispatch<SetStateAction<string>>;
};

export default function CurrentAccess(props: Props) {
  const { setActiveStep } = props;
  const { id: deckId, deck_name } = useCurrentDeck();
  const [conditions, setConditions] = useState([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initAcc = async () => {
      const { data, error } = await supabase.from<Deck>('decks').select('access_params').match({ id: deckId }).single();
      if (!data || error) {
        setError(error.message || 'Could not fetch data');
        setReady(true);
        return;
      }

      const accessControlConditions = data?.access_params.access_control_conditions;
      if (accessControlConditions?.length === 1) {
        setError('No access control conditions have been configured yet.');
        setReady(true);
        return;
      }

      let result = await LitJsSdk.humanizeAccessControlConditions({
        accessControlConditions: accessControlConditions.slice(2),
      });
      if (
        !result &&
        (accessControlConditions.slice(2)[0] as AccessControlCondition).standardContractType === 'ProofOfHumanity'
      ) {
        result = 'Is registered with Proof of Humanity';
      }

      setConditions(result.split(' or '));
      setReady(true);
    };
    initAcc();
  }, [deckId]);

  const renderContent = () => {
    if (!ready) return null;

    if (error) return <p>{error}</p>;

    const multipleConditions = conditions.length > 1;

    return (
      <>
        <p>{`User must meet ${multipleConditions ? 'one or more of' : ''} ${
          multipleConditions ? 'these' : 'this'
        } condition${multipleConditions ? 's' : ''}:`}</p>
        <ul className="list-disc ml-8 mt-4">
          {conditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div>
      <div className="text-lg font-heading tracking-wide">Current workspace access control conditions</div>
      <div className="flex space-x-4 items-center">
        <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
          {deck_name}
        </span>
        <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
          {deckId}
        </span>
      </div>
      <div className="mt-4">{renderContent()}</div>

      <Navigation
        backward={{ onClick: () => setActiveStep('ableToAccess') }}
        forward={{
          label: 'Get a shareable link',
          onClick: async () => setActiveStep('accessCreated'),
          withoutIcon: true,
          disabled: false,
          loading: false,
        }}
      />
    </div>
  );
}
