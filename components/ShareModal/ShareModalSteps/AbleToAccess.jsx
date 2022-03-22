import React from 'react';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { WalletIcon, TokenIcon, DAOIcon, POAPIcon } from '../icons';

const TypeButton = props => {
  const { type, icon, title, onClick } = props;

  return (
    <button
      className="flex flex-col justify-between items-center py-2 w-[180px] h-[148px] border border-white cursor-pointer box-border text-white hover:bg-gray-900 focus:bg-gray-900"
      onClick={() => onClick(type)}
    >
      {icon}
      <div className="mb-2">{title}</div>
    </button>
  );
};

const ITEMS = [
  {
    type: 'whichWallet',
    icon: <WalletIcon />,
    title: 'An Individual Wallet',
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
];

const AbleToAccess = props => {
  const { setActiveStep } = props;
  const { deck } = useCurrentDeck();

  return (
    <div className="mb-4">
      <div className="text-lg">Who should be able to access this DECK?</div>
      <span className="text-xs inline-block mt-2 py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded-sm">
        {deck.id}
      </span>
      <div className="grid grid-cols-[180px_180px] gap-4 justify-center mt-[28px]">
        {ITEMS.map((item, i) => (
          <TypeButton key={i} {...item} onClick={setActiveStep} />
        ))}
      </div>
    </div>
  );
};

export default AbleToAccess;
