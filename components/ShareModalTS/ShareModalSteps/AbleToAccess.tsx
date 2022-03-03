import Navigation from '../Navigation';
import { Wallet, Token, DAO, POAP } from '../icons';

const ITEMS = [
  {
    type: 'whichWallet',
    icon: <Wallet />,
    title: 'A Specific Wallet',
  },
  {
    type: 'selectTokens',
    icon: <Token />,
    title: 'Token or NFT Owners',
  },
  {
    type: 'DAOMembers',
    icon: <DAO />,
    title: 'DAO Members',
  },
  {
    type: 'choosePOAP',
    icon: <POAP />,
    title: 'POAP Collectors',
  },
];

const AbleToAccess = (props: any) => {
  const { setActiveStep, onMainBack } = props;

  return (
    <div className="">
      <div className="max-w-2xl mx-auto px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="">Who should be able to access this asset?</h2>

        <div className="grid grid-cols-2 gap-y-10 gap-x-6 xl:gap-x-8">
          {ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="group flex flex-col justify-items-center items-center border border-gray-400 cursor-pointer py-2 px-2"
              onClick={() => setActiveStep(item.type)}
            >
              <div className="bg-background overflow-hidden">
                <div className="h-full group-hover:opacity-75">{item.icon}</div>
              </div>
              <h3 className="mt-4 text-sm text-white">{item.title}</h3>
            </div>
          ))}
        </div>
        <Navigation backward={{ onClick: onMainBack }} />
      </div>
    </div>
  );
};

export default AbleToAccess;
