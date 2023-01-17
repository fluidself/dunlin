import { Editor, Path } from 'slate';
import { Web3Storage } from 'web3.storage';
import { toast } from 'react-toastify';
import { insertImage, insertVideo } from 'editor/formatting';
import { isUrl } from 'utils/url';
import imageExtensions from 'utils/image-extensions';

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
          toast.error('Only images can be uploaded.');
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text);
    } else if (isYouTubeUrl(text)) {
      const embedLink = extractYoutubeEmbedLink(text);
      if (embedLink) insertVideo(editor, embedLink);
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

export const getImageElementUrl = (cidOrUrl: string) => {
  return isUrl(cidOrUrl) ? cidOrUrl : `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${cidOrUrl}`;
};

export const uploadAndInsertImage = async (editor: Editor, file: File, path?: Path) => {
  const TOKEN = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN as string;
  const ENDPOINT = process.env.NEXT_PUBLIC_WEB3STORAGE_ENDPOINT as string;
  const client = new Web3Storage({ token: TOKEN, endpoint: new URL(ENDPOINT) });
  const UPLOAD_LIMIT = 2 * 1024 * 1024; // 2 MB

  if (file.size > UPLOAD_LIMIT) {
    toast.error('Your image is over the 2 MB limit. Please upload a smaller image.');
    return;
  }

  const uploadingToast = toast.info('Uploading image, please wait...', {
    autoClose: false,
    closeButton: false,
    draggable: false,
  });

  const cid = await client.put([file], { wrapWithDirectory: false });

  toast.dismiss(uploadingToast);
  if (cid) {
    insertImage(editor, cid, path);
  } else {
    toast.error('There was a problem uploading your image. Please try again later.');
  }
};

const isYouTubeUrl = (url: string) => {
  const YOUTUBE_REGEX =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

  return url?.match(YOUTUBE_REGEX);
};

export const extractYoutubeEmbedLink = (url: string): string | null => {
  const linkType = extractYoutubeLinkType(url);
  let embedUrl: string | null = null;

  if (linkType) {
    const { pathname, search } = new URL(url);
    const urlSearchParams = new URLSearchParams(search);

    if (linkType === 'youtube_link') {
      embedUrl = `https://www.youtube.com/embed/${urlSearchParams.get('v')}`;
    } else if (linkType === 'youtube_shared_link') {
      embedUrl = `https://www.youtube.com/embed${pathname}`;
    } else {
      embedUrl = url;
    }
    if (urlSearchParams.has('t')) {
      embedUrl += `?start=${urlSearchParams.get('t')}`;
    }
  }

  return embedUrl;
};

const extractYoutubeLinkType = (url: string) => {
  if (url.includes('https://www.youtube.com/embed')) {
    return 'youtube_embed_link';
  } else if (url.includes('youtube.com')) {
    return 'youtube_link';
  } else if (url.includes('youtu.be')) {
    return 'youtube_shared_link';
  }

  return null;
};

export default withMedia;
