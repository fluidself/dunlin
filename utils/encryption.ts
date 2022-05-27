// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
const { secretbox, randomBytes } = require('tweetnacl');
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = require('tweetnacl-util');
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { Descendant } from 'slate';
import type { AuthSig } from 'types/lit';
import type { Note } from 'types/supabase';
import { DecryptedNote } from 'types/decrypted';

const newNonce = () => randomBytes(secretbox.nonceLength);
export const generateKey = () => encodeBase64(randomBytes(secretbox.keyLength));

export const encrypt = (toEncrypt: any, key: string) => {
  const keyUint8Array = decodeBase64(key);

  const nonce = newNonce();
  const messageUint8 = decodeUTF8(JSON.stringify(toEncrypt));
  const box = secretbox(messageUint8, nonce, keyUint8Array);

  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);

  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
};

export const decrypt = (messageWithNonce: string, key: string) => {
  const keyUint8Array = decodeBase64(key);
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(secretbox.nonceLength, messageWithNonce.length);

  const decrypted = secretbox.open(message, nonce, keyUint8Array);

  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }

  const base64DecryptedMessage = encodeUTF8(decrypted);
  return JSON.parse(base64DecryptedMessage);
};

function blobToBase64(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(
        // @ts-ignore
        reader.result.replace('data:application/octet-stream;base64,', ''),
      );
    reader.readAsDataURL(blob);
  });
}

export async function encryptWithLit(
  toEncrypt: string,
  accessControlConditions: Array<Object>,
  chain: string = 'ethereum',
): Promise<Array<any>> {
  const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(toEncrypt);
  const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain,
    permanent: false,
  });

  const encryptedStringBase64 = await blobToBase64(encryptedString);
  const encryptedSymmetricKeyBase64 = encodeBase64(encryptedSymmetricKey);

  return [encryptedStringBase64, encryptedSymmetricKeyBase64];
}

export async function decryptWithLit(
  encryptedString: string,
  encryptedSymmetricKey: string,
  accessControlConditions: Array<Object>,
  chain: string = 'ethereum',
): Promise<string> {
  const decodedString = decodeBase64(encryptedString);
  const decodedSymmetricKey = decodeBase64(encryptedSymmetricKey);

  if (!decodedString || !decodedSymmetricKey) {
    throw new Error('Decryption failed');
  }

  const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
  const toDecrypt = uint8ArrayToString(decodedSymmetricKey, 'base16');

  const decryptedSymmetricKey = await window.litNodeClient.getEncryptionKey({
    accessControlConditions,
    toDecrypt,
    chain,
    authSig,
  });
  const decryptedString = await LitJsSdk.decryptString(new Blob([decodedString]), decryptedSymmetricKey);

  return decryptedString;
}

export const encryptNote = (note: any, key: string) => {
  const encryptedNote = { ...note };
  if (note.title) encryptedNote.title = encrypt(note.title, key);
  if (note.content) encryptedNote.content = encrypt(note.content, key);

  return encryptedNote;
};

export const decryptNote = (encryptedNote: Note, key: string): DecryptedNote => {
  const { title, content, ...rest } = encryptedNote;
  const decryptedTitle: string = decrypt(title, key);
  const decryptedContent: Descendant[] = decrypt(content, key);

  return { title: decryptedTitle, content: decryptedContent, ...rest };
};
