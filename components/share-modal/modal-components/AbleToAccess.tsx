import type { Dispatch, SetStateAction } from 'react';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useStore } from 'lib/store';
import { WalletIcon, TokenIcon, DAOIcon, POAPIcon, ProofOfHumanityIcon, GlobeIcon } from '../icons';

type TypeButtonProps = {
  type: string;
  icon: JSX.Element;
  title: string;
  onClick: (type: string) => void;
};

const TypeButton = (props: TypeButtonProps) => {
  const { type, icon, title, onClick } = props;

  return (
    <button
      className="flex flex-col justify-between items-center py-2 w-[180px] h-[148px] border border-gray-400 dark:border-gray-100 cursor-pointer box-border dark:text-gray-100 hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
      onClick={() => onClick(type)}
    >
      {icon}
      <div className="mb-1">{title}</div>
    </button>
  );
};

const ITEMS = [
  {
    type: 'whichWallet',
    icon: <WalletIcon />,
    title: 'Individual Wallet(s)',
  },
  {
    type: 'selectTokens',
    icon: <TokenIcon />,
    title: 'A Group of Token or NFT Owners',
  },
  {
    type: 'DAOMembers',
    icon: <DAOIcon />,
    title: 'DAO Members',
  },
  {
    type: 'choosePOAP',
    icon: <POAPIcon />,
    title: 'POAP Collectors',
  },
  {
    type: 'proofOfHumanity',
    icon: <ProofOfHumanityIcon />,
    title: 'Proof of Humanity',
  },
  {
    type: 'openAccess',
    icon: <GlobeIcon />,
    title: 'Anyone',
  },
];

type Props = {
  setActiveStep: Dispatch<SetStateAction<string>>;
};

const AbleToAccess = (props: Props) => {
  const { setActiveStep } = props;
  const { id, deck_name } = useCurrentDeck();
  const collaborativeDeck = useStore(state => state.collaborativeDeck);

  return (
    <div className="mb-4">
      <div className="text-lg">Who should be able to access this workspace?</div>
      <div className="flex space-x-4 items-center">
        <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
          {deck_name}
        </span>
        <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
          {id}
        </span>
      </div>

      <div className="grid grid-cols-[180px_180px_180px] gap-4 justify-center mt-[28px]">
        {ITEMS.map((item, i) => (
          <TypeButton key={i} {...item} onClick={setActiveStep} />
        ))}
      </div>
      {collaborativeDeck && (
        <div className="w-full flex flex-col space-y-2 items-center justify-center mt-6">
          <a className="text-sm hover:underline cursor-pointer" onClick={() => setActiveStep('currentAccess')}>
            See current conditions
          </a>
          <a className="text-sm hover:underline cursor-pointer" onClick={() => setActiveStep('revokeAccess')}>
            Revoke all access
          </a>
        </div>
      )}
    </div>
  );
};

export default AbleToAccess;
