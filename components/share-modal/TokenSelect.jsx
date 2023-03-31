import React, { useState, useMemo } from 'react';
import { WindowedMenuList, createFilter, components } from 'react-windowed-select';
import Creatable from 'react-select/creatable';
import { useStore } from 'lib/store';
import Button from 'components/Button';

const Option = ({ data: { label, logo, symbol }, ...props }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onMouseMove, onMouseOver, ...rest } = props.innerProps;
  const newProps = Object.assign(props, { innerProps: rest });
  const darkMode = useStore(state => state.darkMode);
  const className = `flex items-center h-10 cursor-pointer ${darkMode ? 'text-white' : ''}`;

  return (
    <components.Option {...newProps} style={{ padding: 0, zIndex: 105 }}>
      <div className={className}>
        <div
          className="w-8 h-8 rounded-full bg-black bg-no-repeat bg-contain bg-center mx-2"
          style={{ backgroundImage: logo ? `url(${logo})` : undefined }}
        />
        <div>
          <div>{label}</div>
          <div>{symbol}</div>
        </div>
      </div>
    </components.Option>
  );
};

const TOP_LIST = [
  {
    label: 'Ethereum',
    value: 'ethereum',
    symbol: 'ETH',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg',
  },
  {
    label: 'USD Coin',
    logo: 'https://etherscan.io/token/images/centre-usdc_28.png',
    value: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    standard: 'ERC20',
  },
  {
    label: 'BoredApeYachtClub',
    logo: 'https://etherscan.io/token/images/boredapeyc_32.png',
    value: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    symbol: 'BAYC',
    standard: 'ERC721',
  },
  {
    label: 'Art Blocks',
    logo: 'https://lh3.googleusercontent.com/sdPql8yt3eT5qmQfbCoU8a1I6aMNsqQEj6D1fMTuw101XKILNmzp7QVsdkGff2T39MgcHT-Aha18cWBqjCdhzRWzBw=s120',
    value: '0x059edd72cd353df5106d2b9cc5ab83a52287ac3a',
    symbol: 'BLOCKS',
    standard: 'ERC721',
  },
];

const TokenSelect = props => {
  const { tokenList, onSelect } = props;
  const darkMode = useStore(state => state.darkMode);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const tokenSelectBoxRows = useMemo(() => {
    return [
      {
        label: 'Ethereum',
        value: 'ethereum',
        symbol: 'ETH',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg',
      },
      ...tokenList.map(t => ({
        label: t.name,
        value: t.address,
        standard: t.standard,
        logo: t.logoURI,
        symbol: t.symbol,
      })),
    ];
  }, [tokenList]);

  const handleSelect = () => {
    onSelect(selectedToken);
    setModalIsOpen(false);
  };

  return (
    <div>
      <Button className="py-[12px]" onClick={() => setModalIsOpen(true)}>
        Search for a token/NFT
      </Button>

      {modalIsOpen && (
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setModalIsOpen(false)} />
          <div className="flex items-center justify-center h-screen p-6">
            <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-white dark:bg-gray-900 border border-gray-600 sm:max-h-[280px] sm:w-[450px] py-2 px-4">
              <div>
                <label className="mb-2 block font-heading tracking-wide">Top Tokens/NFTS</label>
                <div className="flex mb-2">
                  {TOP_LIST.map(t => (
                    <div
                      className={`px-2 py-px flex items-center mr-2 border cursor-pointer ${
                        t && t['symbol'] && selectedToken && t['symbol'] === selectedToken['symbol']
                          ? 'border-2 border-primary-500'
                          : 'my-px mr-2 ml-px'
                      }`}
                      key={t.symbol}
                      onClick={() => setSelectedToken(t)}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-no-repeat bg-contain bg-center mr-1"
                        style={{
                          backgroundImage: t.logo ? `url(${t.logo})` : undefined,
                        }}
                      />
                      <div>{t.symbol}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8">
                <label>Search</label>
                <Creatable
                  filterOption={createFilter({ ignoreAccents: false })}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  components={{ Option, MenuList: WindowedMenuList }}
                  isClearable
                  isSearchable
                  defaultValue={''}
                  options={tokenSelectBoxRows}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    option: base => ({
                      ...base,
                      backgroundColor: darkMode ? 'rgb(23 23 23 / var(--tw-bg-opacity))' : 'white',
                    }),
                    menuList: base => ({
                      ...base,
                      backgroundColor: darkMode ? 'rgb(23 23 23 / var(--tw-bg-opacity))' : 'white',
                    }),
                  }}
                  menuPortalTarget={document.body}
                  onChange={setSelectedToken}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Button primary disabled={!selectedToken} onClick={handleSelect}>
                  Select
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelect;
