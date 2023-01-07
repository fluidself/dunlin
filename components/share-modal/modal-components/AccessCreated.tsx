import { IconCopy } from '@tabler/icons';
import copyToClipboard from 'utils/copyToClipboard';
import Button from 'components/Button';

type Props = {
  deckToShare: string;
  onClose: () => void;
};

export default function AccessCreated({ deckToShare, onClose }: Props) {
  const invitationLink = `${process.env.BASE_URL}/join/${deckToShare}`;

  return (
    <div>
      <div>
        <h4 className="text-lg">Access to your workspace has been configured</h4>
      </div>
      <div className="mt-8">
        <p>Share this link with those you have granted access:</p>
        <div className="bg-gray-800 mt-4 mb-8 p-2 w-max rounded-md text-sm flex justify-between">
          {invitationLink}
          <IconCopy
            className="ml-4 hover:text-gray-300"
            role="button"
            onClick={async () => await copyToClipboard(invitationLink)}
          />
        </div>
        <Button onClick={onClose}>All Done</Button>
      </div>
    </div>
  );
}
