import { IconLogout } from '@tabler/icons';
import { useAuth } from 'utils/useAuth';
import Identicon from 'components/Identicon';

export default function HomeHeader() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center">
      <span className="mr-2 text-sm">{user?.id && `${user?.id.slice(0, 6)}...${user?.id.slice(-4)}`}</span>
      <Identicon diameter={16} className="w-5 h-5" />
      <IconLogout size={20} className="cursor-pointer ml-4" onClick={signOut} />
    </div>
  );
}
