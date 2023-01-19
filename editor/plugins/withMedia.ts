import LitJsSdk from 'lit-js-sdk';
import { encodeBase64 } from 'tweetnacl-util';
import { Editor, Path } from 'slate';
import { Web3Storage } from 'web3.storage';
import { toast } from 'react-toastify';
import { insertFileAttachment, insertMedia } from 'editor/formatting';
import { ElementType, UploadedFile } from 'types/slate';
import { isUrl } from 'utils/url';
import imageExtensions from 'utils/image-extensions';
import { extractYoutubeEmbedLink } from 'utils/video';

const withMedia = (editor: Editor) => {
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
          uploadAndInsertFile(editor, file);
        }
      }
    } else if (isImageUrl(text)) {
      insertMedia(editor, ElementType.Image, text);
    } else if (isYouTubeUrl(text)) {
      const embedLink = extractYoutubeEmbedLink(text);
      if (embedLink) insertMedia(editor, ElementType.Video, embedLink);
    } else {
      insertData(data);
    }
  };

  return editor;
};

export const uploadAndInsertImage = async (editor: Editor, file: File, path?: Path) => {
  const cid = await uploadFile(file);

  if (cid) {
    insertMedia(editor, ElementType.Image, cid, path);
  }
};

export const uploadAndInsertFile = async (editor: Editor, file: File, path?: Path) => {
  try {
    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({ file });
    const symmetricKeyBase64 = encodeBase64(symmetricKey);
    const cid = await uploadFile(encryptedFile);

    if (cid) {
      const uploadedFile: UploadedFile = {
        cid,
        symmKey: symmetricKeyBase64,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };
      insertFileAttachment(editor, uploadedFile, path);
    }
  } catch (e) {
    console.error(e);
  }
};

const uploadFile = async (file: File) => {
  const UPLOAD_LIMIT = 5 * 1024 * 1024; // 5 MB

  if (file.size > UPLOAD_LIMIT) {
    toast.error('Your file is over the 5 MB limit. Please upload a smaller file.');
    return;
  }

  try {
    const TOKEN = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN as string;
    const ENDPOINT = process.env.NEXT_PUBLIC_WEB3STORAGE_ENDPOINT as string;
    const client = new Web3Storage({ token: TOKEN, endpoint: new URL(ENDPOINT) });

    const uploadingToast = toast.info('Uploading file, please wait...', {
      autoClose: false,
      closeButton: false,
      draggable: false,
    });

    const cid = await client.put([file], { wrapWithDirectory: false });

    toast.dismiss(uploadingToast);

    if (cid) {
      return cid;
    } else {
      toast.error('There was a problem uploading your file. Please try again later.');
    }
  } catch (e) {
    console.error(e);
  }
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

const isYouTubeUrl = (url: string) => {
  const YOUTUBE_REGEX =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

  return url?.match(YOUTUBE_REGEX);
};

export default withMedia;
