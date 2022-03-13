import React from 'react';
import { WalletIcon, TokenIcon, DAOIcon, POAPIcon } from '../icons';
import Navigation from '../Navigation';

const TypeButton = props => {
  const { type, icon, title, onClick } = props;

  return (
    <div
      className="flex flex-col justify-between py-2 w-[180px] h-[148px] border border-white cursor-pointer box-border text-white"
      onClick={() => onClick(type)}
    >
      {icon}
      <div className="text-white mb-2 text-center">{title}</div>
    </div>
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

  return (
    <div className="mb-4">
      <div className="text-lg">Who should be able to access your DECK?</div>
      <div className="grid grid-cols-[180px_180px] gap-4 justify-center mt-[28px]">
        {ITEMS.map((item, i) => (
          <TypeButton key={i} {...item} onClick={setActiveStep} />
        ))}
      </div>
      <Navigation backward={{ onClick: () => setActiveStep('provideString') }} forward={null} />
    </div>
  );
};

export default AbleToAccess;
