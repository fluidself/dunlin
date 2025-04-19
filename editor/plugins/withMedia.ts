import { encryptFile } from '@lit-protocol/encryption';
import { encodeBase64 } from 'tweetnacl-util';
import { Editor, Path, Range } from 'slate';
import { toast } from 'react-toastify';
import { insertExternalLink, insertFileAttachment, insertImage, insertVideo } from 'editor/formatting';
import type { UploadedFile } from 'types/slate';
import { isUrl } from 'utils/url';
import imageExtensions from 'utils/image-extensions';
import { extractYoutubeEmbedLink, isYouTubeUrl } from 'utils/video';

const withMedia = (editor: Editor) => {
  const { insertData } = editor;

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    const { files } = data;

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
      insertImage(editor, text);
    } else if (isYouTubeUrl(text)) {
      const { selection } = editor;
      const isCollapsed = selection && Range.isCollapsed(selection);

      if (isCollapsed) {
        const youtubeEmbedLink = extractYoutubeEmbedLink(text);
        if (youtubeEmbedLink) insertVideo(editor, youtubeEmbedLink);
      } else {
        insertExternalLink(editor, text);
      }
    } else {
      insertData(data);
    }
  };

  return editor;
};

export const uploadAndInsertImage = async (editor: Editor, file: File, path?: Path) => {
  const cid = await uploadFile(file);

  if (cid) {
    insertImage(editor, cid, path);
  }
};

export const uploadAndInsertFile = async (editor: Editor, file: File, path?: Path) => {
  try {
    const { encryptedFile, symmetricKey } = await encryptFile({ file });
    const symmetricKeyBase64 = encodeBase64(symmetricKey as Uint8Array);
    const cid = await uploadFile(new File([encryptedFile], file.name, { type: 'application/octet-stream' }));

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

  const uploadingToast = toast.info('Uploading file, please wait...', {
    autoClose: false,
    closeButton: false,
    draggable: false,
  });

  try {
    const data = new FormData();
    data.set('file', file);
    const uploadResponse = await fetch('/api/file', {
      method: 'POST',
      body: data,
    });
    const { cid } = await uploadResponse.json();

    toast.dismiss(uploadingToast);

    if (cid) {
      return cid;
    } else {
      toast.error('There was a problem uploading your file. Please try again later.');
    }
  } catch (e) {
    console.error(e);
    toast.dismiss(uploadingToast);
    toast.error('There was a problem uploading your file. Please try again later.');
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

export default withMedia;
