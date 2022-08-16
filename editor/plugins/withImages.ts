import { Editor, Path } from 'slate';
import { Web3Storage } from 'web3.storage';
import { toast } from 'react-toastify';
import { insertImage } from 'editor/formatting';
import { isUrl } from 'utils/url';
import imageExtensions from 'utils/image-extensions';

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
  const WEB3STORAGE_TOKEN = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN as string;
  const ENDPOINT = process.env.NEXT_PUBLIC_WEB3STORAGE_ENDPOINT as string;
  const client = new Web3Storage({ token: WEB3STORAGE_TOKEN, endpoint: new URL(ENDPOINT) });

  const uploadingToast = toast.info('Uploading image, please wait...', {
    autoClose: false,
    closeButton: false,
    draggable: false,
  });

  const cid = await client.put([file], { wrapWithDirectory: false });

  toast.dismiss(uploadingToast);
  if (cid) {
    const url = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${cid}`;
    insertImage(editor, url, path);
  } else {
    toast.error('There was a problem uploading your image. Please try again later.');
  }
};

export default withImages;
