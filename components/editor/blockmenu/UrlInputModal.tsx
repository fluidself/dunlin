import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Path } from 'slate';
import { useSlate } from 'slate-react';
import { IconBrandYoutube, IconTerminal2, IconX } from '@tabler/icons';
import type { OembedData } from '@extractus/oembed-extractor';
import { extractYoutubeEmbedLink, isYouTubeUrl } from 'utils/video';
import useHotkeys from 'utils/useHotkeys';
import { isUrl } from 'utils/url';
import { insertEmbed, insertVideo } from 'editor/formatting';
import Button from 'components/Button';
import { ElementType } from 'types/slate';

export type UrlInputModalState = {
  isOpen: boolean;
  type?: ElementType.Embed | ElementType.Video;
  path?: Path;
};

type Props = {
  state: UrlInputModalState;
  setState: Dispatch<SetStateAction<UrlInputModalState>>;
};

export default function UrlInputModal(props: Props) {
  const { state, setState } = props;
  const editor = useSlate();
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => setState({ isOpen: false }),
      },
    ],
    [setState],
  );
  useHotkeys(hotkeys);

  const handleEmbed = async () => {
    if (!inputText || !state.path || !state.type) return;
    if (!isUrl(inputText)) {
      setError('Please enter a valid URL');
      return;
    }

    const youtubeEmbedUrl = isYouTubeUrl(inputText) && extractYoutubeEmbedLink(inputText);
    if (!youtubeEmbedUrl && inputText.match(/youtu\.be\/|youtube\.com/)) {
      setError('Please enter a valid YouTube URL');
      return;
    } else if (youtubeEmbedUrl) {
      return insertAndClose(ElementType.Video, youtubeEmbedUrl);
    }

    const embedUrl = extractEmbedUrl(inputText);
    if (embedUrl) {
      return insertAndClose(ElementType.Embed, embedUrl);
    }

    const res = await fetch(`/api/extract-oembed?url=${inputText}`);
    const { oembed }: { oembed?: OembedData } = await res.json();
    if ((oembed && (oembed.type === 'video' || oembed.type === 'rich')) || inputText.includes('embed')) {
      return insertAndClose(ElementType.Embed, inputText, oembed);
    }

    setError('Provided URL is not supported');
  };

  const insertAndClose = (type: ElementType.Video | ElementType.Embed, url: string, oembed?: OembedData) => {
    if (type === ElementType.Video) {
      insertVideo(editor, url, state.path);
    } else {
      insertEmbed(editor, url, oembed, state.path);
    }
    setState({ isOpen: false });
  };

  if (!state.type) {
    return null;
  }

  const Icon = state.type === ElementType.Video ? IconBrandYoutube : IconTerminal2;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setState({ isOpen: false })} />
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-900 text-gray-200 border border-gray-600">
          <div className="flex items-center justify-between flex-shrink-0 w-full">
            <div className="flex items-center">
              <Icon className="ml-4 mr-1 text-gray-200" size={32} />
              <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0">
                {`Insert ${state.type === ElementType.Video ? 'a video' : 'an embed'}`}
              </span>
            </div>
            <button className="mb-6 mr-2 text-gray-300 hover:text-gray-100" onClick={() => setState({ isOpen: false })}>
              <IconX size={20} />
            </button>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-800 border-gray-700">
            <input
              type="text"
              className={`w-full py-3 px-2 text-xl rounded focus:ring-0 bg-gray-900 text-gray-200 border ${
                error ? 'border-red-500 focus:border-red-500' : 'border-gray-900 focus:border-gray-900'
              }`}
              placeholder={`Enter ${state.type === ElementType.Video ? 'video URL' : 'URL to embed'}`}
              value={inputText}
              onChange={e => {
                e.target.value !== '' && setError('');
                setInputText(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEmbed();
                }
              }}
              autoFocus
            />
            <div className="text-red-500 min-h-[24px]">{error}</div>
            <div className="flex items-center justify-end space-x-4">
              <Button primary onClick={handleEmbed}>
                Insert
              </Button>
              <Button onClick={() => setState({ isOpen: false })}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractEmbedUrl(url: string) {
  if (url.includes('www.figma.com')) {
    return `https://www.figma.com/embed?embed_host=dunlin&url=${url}`;
  }
  if (url.includes('www.loom.com')) {
    return url.replace('share', 'embed');
  }
  if (url.includes('airtable.com')) {
    return url.includes('embed') ? url : `https://airtable.com/embed/${url.split('/').pop()}`;
  }

  return null;
}
