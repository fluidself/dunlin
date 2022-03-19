import React from 'react';
import { toast } from 'react-toastify';
import { IconCopy } from '@tabler/icons';
import Button from 'components/home/Button';

const AccessCreated = ({ deckToShare, onClose }) => {
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(deckToShare);

    toast.success('Copied!');
  };

  return (
    <div>
      <div>
        <h4 className="text-lg">Access to your DECK has been configured!</h4>
      </div>

      <div className="mt-8">
        Share this DECK ID with those you have granted access:
        <div
          role="button"
          className="bg-gray-900 flex mt-4 p-2 max-w-[26rem] rounded-md overflow-ellipsis"
          onClick={copyToClipboard}
        >
          {deckToShare}
          <IconCopy className="ml-4" />
        </div>
        <Button className="mt-8" onClick={onClose}>
          All done
        </Button>
      </div>
    </div>
  );
};

export default AccessCreated;
