import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Path } from 'slate';
import { useSlate } from 'slate-react';
import { IconBrandYoutube, IconX } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import { insertMedia } from 'editor/formatting';
import { extractYoutubeEmbedLink } from 'editor/plugins/withMedia';
import Button from 'components/Button';
import { ElementType } from 'types/slate';

export type VideUrlModalState = {
  isOpen: boolean;
  path?: Path;
};

type Props = {
  state: VideUrlModalState;
  setState: Dispatch<SetStateAction<VideUrlModalState>>;
};

export default function VideoUrlModal(props: Props) {
  const { state, setState } = props;
  const editor = useSlate();
  const [inputText, setInputText] = useState('');
  const [isInvalid, setInvalid] = useState(false);

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

  const onClick = () => {
    if (!inputText || !state.path) return;

    const embedLink = extractYoutubeEmbedLink(inputText);
    if (!embedLink) {
      setInvalid(true);
      return;
    }

    insertMedia(editor, ElementType.Video, embedLink, state.path);
    setState({ isOpen: false });
  };

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setState({ isOpen: false })} />
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-900 text-gray-200 border border-gray-600">
          <div className="flex items-center justify-between flex-shrink-0 w-full">
            <div className="flex items-center">
              <IconBrandYoutube className="ml-4 mr-1 text-gray-200" size={32} />
              <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0">Insert video</span>
            </div>
            <button className="mb-6 mr-2 text-gray-300 hover:text-gray-100" onClick={() => setState({ isOpen: false })}>
              <IconX size={20} />
            </button>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-800 border-gray-700">
            <input
              type="text"
              className={`w-full py-3 px-2 text-xl rounded focus:ring-0 bg-gray-900 text-gray-200 ${
                isInvalid ? 'border border-red-500 focus:border-red-500' : 'border-none'
              }`}
              placeholder="Enter YouTube URL"
              autoFocus
              value={inputText}
              onChange={e => {
                e.target.value !== '' && setInvalid(false);
                setInputText(e.target.value);
              }}
            />
            {isInvalid && <div className="text-red-500">Are you sure you entered a valid YouTube URL?</div>}
            <div className="flex items-center justify-end space-x-4 mt-4">
              <Button primary onClick={onClick}>
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
