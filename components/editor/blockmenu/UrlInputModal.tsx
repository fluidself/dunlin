import { Dispatch, SetStateAction } from 'react';
import EmbedUrlInput, { type EmbedUrlInputState } from 'components/EmbedUrlInput';

type Props = {
  state: EmbedUrlInputState;
  setState: Dispatch<SetStateAction<EmbedUrlInputState>>;
};

export default function UrlInputModal(props: Props) {
  const { state, setState } = props;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setState({ isOpen: false })} />
      <div className="flex items-center justify-center h-screen">
        <EmbedUrlInput state={state} setState={setState} />
      </div>
    </div>
  );
}
