import { IconFile, IconGhost2, IconSearch } from '@tabler/icons';
import Tooltip from 'components/Tooltip';
import { SidebarTab as SidebarTabType, useStore } from 'lib/store';
import { modifierKey } from 'utils/device';
import SidebarNotes from './SidebarNotes';
import SidebarSearch from './SidebarSearch';
import SidebarDaemonSessions from './SidebarDaemonSessions';
import SidebarTab from './SidebarTab';

type Props = {
  className?: string;
};

export default function SidebarContent(props: Props) {
  const { className } = props;
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const activeTab = useStore(state => state.sidebarTab);
  const setActiveTab = useStore(state => state.setSidebarTab);

  return (
    <div className={`flex flex-col ${className}`}>
      <Tabs isDaemonUser={isDaemonUser} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-col flex-1 overflow-x-hidden mt-px">
        {activeTab === SidebarTabType.Notes ? <SidebarNotes /> : null}
        {activeTab === SidebarTabType.Search ? <SidebarSearch /> : null}
        {activeTab === SidebarTabType.Daemon ? <SidebarDaemonSessions /> : null}
      </div>
    </div>
  );
}

type TabsProps = {
  isDaemonUser: boolean;
  activeTab: SidebarTabType;
  setActiveTab: (tab: SidebarTabType) => void;
};

const Tabs = (props: TabsProps) => {
  const { isDaemonUser, activeTab, setActiveTab } = props;
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
          className={
            activeTab === SidebarTabType.Search && isDaemonUser
              ? 'border-x'
              : activeTab === SidebarTabType.Search
              ? 'border-l'
              : ''
          }
        />
      </Tooltip>
      {isDaemonUser ? (
        <Tooltip content={`Daemon sessions (${key}+Shift+D)`}>
          <SidebarTab
            isActive={activeTab === SidebarTabType.Daemon}
            setActive={() => setActiveTab(SidebarTabType.Daemon)}
            Icon={IconGhost2}
            className={activeTab === SidebarTabType.Daemon ? 'border-l' : ''}
          />
        </Tooltip>
      ) : null}
    </div>
  );
};
