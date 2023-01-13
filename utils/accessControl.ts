import supabase from 'lib/supabase';
import { store } from 'lib/store';
import { User, Deck, Contributor } from 'types/supabase';
import { AccessControlCondition, BooleanCondition } from 'types/lit';
import { decryptWithLit, encryptWithLit } from 'utils/encryption';

export async function verifyDeckAccess(deckId: string, user: User) {
  const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

  try {
    if (!deckId.match(UUID_REGEX)) throw new Error('Unable to verify access');

    const { data: deck } = await supabase
      .from<Deck>('decks')
      .select('user_id, access_params')
      .eq('id', deckId)
      .single();
    if (!deck) throw new Error('Unable to verify access');

    if (deck.user_id === user.id) {
      await supabase.from<Contributor>('contributors').upsert({ deck_id: deckId, user_id: user.id });
      return true;
    }

    const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = deck.access_params;
    const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
    if (!deckKey) throw new Error('Unable to verify access');

    const { data } = await supabase.from<Contributor>('contributors').upsert({ deck_id: deckId, user_id: user.id });
    if (!data) throw new Error('Unable to verify access');

    return true;
  } catch (error) {
    return false;
  }
}

export async function configureDeckAccess(deckId: string, userId: string, key: string, acc: AccessControlCondition[]) {
  try {
    const accessControlConditions: (AccessControlCondition | BooleanCondition)[] = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: userId,
        },
      },
      { operator: 'or' },
      ...acc,
    ];
    const [encryptedStringBase64, encryptedSymmetricKeyBase64] = await encryptWithLit(key, accessControlConditions);
    const accessParams = {
      encrypted_string: encryptedStringBase64,
      encrypted_symmetric_key: encryptedSymmetricKeyBase64,
      access_control_conditions: accessControlConditions,
    };

    const { data: deck, error } = await supabase
      .from<Deck>('decks')
      .update({ access_params: accessParams })
      .eq('id', deckId)
      .single();
    if (!deck || error) throw new Error('Unable to configure access');

    await store.getState().setCollaborativeDeck(accessControlConditions.length > 1);
    return true;
  } catch (error) {
    return false;
  }
}
