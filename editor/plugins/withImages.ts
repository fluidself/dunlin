import { Editor, Path } from 'slate';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import fleekStorage from '@fleekhq/fleek-storage-js';
import { insertImage } from 'editor/formatting';
import { isUrl } from 'utils/url';
import imageExtensions from 'utils/image-extensions';
import { store } from 'lib/store';

const withImages = (editor: Editor) => {
  const { insertData } = editor;

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    const { files } = data;

    // TODO: there is a bug on iOS Safari where the files array is empty
    // See https://github.com/ianstormtaylor/slate/issues/4491
    if (files && files.length > 0) {
      for (const file of files) {
        const [mime] = file.type.split('/');
        if (mime === 'image') {
          uploadAndInsertImage(editor, file);
        } else {
          toast.error('Only images can be uploaded.');
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

const isImageUrl = (url: string) => {
  if (!url || !isUrl(url)) {
    return false;
  }
  const ext = new URL(url).pathname.split('.').pop();
  if (ext) {
    return imageExtensions.includes(ext);
  }
  return false;
};

export const uploadAndInsertImage = async (editor: Editor, file: File, path?: Path) => {
  const deckId = store.getState().deckId;
  if (!deckId) {
    return;
  }

  const uploadingToast = toast.info('Uploading image, please wait...', {
    autoClose: false,
    closeButton: false,
    draggable: false,
  });
  const key = `${deckId}/${uuidv4()}.png`;
  const uploadedFile = await fleekStorage.upload({
    apiKey: process.env.NEXT_PUBLIC_FLEEK_API_KEY ?? '',
    apiSecret: process.env.NEXT_PUBLIC_FLEEK_API_SECRET ?? '',
    key,
    data: file,
  });

  toast.dismiss(uploadingToast);
  if (uploadedFile) {
    const url = `https://ipfs.infura.io/ipfs/${uploadedFile.hash}`;
    insertImage(editor, url, path);
  } else {
    toast.error('There was a problem uploading your image. Please try again later.');
  }
};

export default withImages;
