import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import { Note } from 'types/supabase';
import { useAuth } from 'utils/useAuth';
import { generateKey, encryptWithLit, encryptNote } from 'utils/encryption';
import createOnboardingNotes from 'utils/createOnboardingNotes';
import { verifyDeckAccess } from 'utils/accessControl';
import Button from 'components/Button';
import { OnboardingStep } from './OnboardingModal';

export enum InputType {
  Create = 'create',
  Access = 'access',
}

type Props = {
  type?: InputType;
  setCurrentStep: (step: OnboardingStep) => void;
};

export default function CreateOrAccessWorkspace(props: Props) {
  const { setCurrentStep, type } = props;

  const router = useRouter();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = async () => {
    if (!inputValue) {
      setInvalid(true);
      return;
    }

    setProcessing(true);

    if (type === InputType.Create) {
      await createWorkspace(inputValue);
    } else if (type === InputType.Access) {
      await verifyAccess(inputValue);
    }

    setProcessing(false);
  };

  const createWorkspace = async (workspaceName: string) => {
    if (!user) return;

    const deckKey = generateKey();
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
    const [encryptedStringBase64, encryptedSymmetricKeyBase64] = await encryptWithLit(deckKey, accessControlConditions);
    const accessParams = {
      encrypted_string: encryptedStringBase64,
      encrypted_symmetric_key: encryptedSymmetricKeyBase64,
      access_control_conditions: accessControlConditions,
    };

    const deck = await insertDeck({
      user_id: user.id,
      deck_name: workspaceName,
      author_only_notes: false,
      author_control_notes: false,
      access_params: accessParams,
    });

    if (!deck) {
      toast.error('There was an error creating the workspace');
      return;
    }

    const onboardingNotes = createOnboardingNotes();
    const upsertData = onboardingNotes.map(note =>
      encryptNote({ ...note, deck_id: deck.id, user_id: user.id, author_only: false }, deckKey),
    );

    await supabase.from<Note>('notes').upsert(upsertData);

    toast.success(`Successfully created ${workspaceName}`);
    router.push(`/app/${deck.id}`);
  };

  const verifyAccess = async (requestedWorkspace: string) => {
    if (!user) return;

    const success = await verifyDeckAccess(requestedWorkspace, user, localStorage.getItem('dbToken') ?? '');

    if (success) {
      toast.success('Access to workspace is granted');
      router.push(`/app/${requestedWorkspace}`);
    } else {
      toast.error('Unable to verify access');
    }
  };

  if (!type) return null;

  return (
    <div className="flex flex-col gap-4 w-96 mx-auto">
      <input
        type="text"
        className={`input-subdued py-2 ${invalid && 'border-red-500 focus:border-red-500'}`}
        placeholder={`Enter workspace ${type === InputType.Create ? 'name' : 'ID'}`}
        maxLength={type === InputType.Create ? 20 : undefined}
        autoComplete="off"
        autoFocus
        value={inputValue}
        onChange={event => {
          event.target.value !== '' && setInvalid(false);
          setInputValue(event.target.value);
        }}
      />
      <div className="flex flex-row gap-4 items-center justify-between w-full">
        <Button className="flex-grow" primary disabled={processing} onClick={handleSubmit}>
          {type === InputType.Create ? 'Create' : 'Join'}
        </Button>
        <Button className="flex-grow" onClick={() => setCurrentStep(OnboardingStep.Options)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
