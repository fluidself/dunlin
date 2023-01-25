import { Dispatch, SetStateAction } from 'react';
import { IconFile, IconSearch } from '@tabler/icons';
import Tooltip from 'components/Tooltip';
import { SidebarTab as SidebarTabType, useStore } from 'lib/store';
import { modifierKey } from 'utils/device';
import SidebarNotes from './SidebarNotes';
import SidebarSearch from './SidebarSearch';
import SidebarTab from './SidebarTab';

type Props = {
  className?: string;
  setIsFindOrCreateModalOpen: Dispatch<SetStateAction<boolean>>;
};

export default function SidebarContent(props: Props) {
  const { className, setIsFindOrCreateModalOpen } = props;
  const activeTab = useStore(state => state.sidebarTab);
  const setActiveTab = useStore(state => state.setSidebarTab);

  return (
    <div className={`flex flex-col ${className}`}>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-col flex-1 overflow-x-hidden mt-px">
        {activeTab === SidebarTabType.Notes ? (
          <SidebarNotes setIsFindOrCreateModalOpen={setIsFindOrCreateModalOpen} />
        ) : null}
        {activeTab === SidebarTabType.Search ? <SidebarSearch /> : null}
      </div>
    </div>
  );
}

type TabsProps = {
  activeTab: SidebarTabType;
  setActiveTab: (tab: SidebarTabType) => void;
};

const Tabs = (props: TabsProps) => {
  const { activeTab, setActiveTab } = props;
  const key = modifierKey();

  return (
    <div className="flex">
      <Tooltip content={`Notes (${key}+Shift+E)`}>
        <SidebarTab
          isActive={activeTab === SidebarTabType.Notes}
          setActive={() => setActiveTab(SidebarTabType.Notes)}
          Icon={IconFile}
          className={activeTab === SidebarTabType.Notes ? 'border-r' : ''}
        />
      </Tooltip>
      <Tooltip content={`Search (${key}+Shift+F)`}>
        <SidebarTab
          isActive={activeTab === SidebarTabType.Search}
          setActive={() => setActiveTab(SidebarTabType.Search)}
          Icon={IconSearch}
          className={activeTab === SidebarTabType.Search ? 'border-l' : ''}
        />
      </Tooltip>
    </div>
  );
};
