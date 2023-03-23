import React from 'react';
import Button from 'components/Button';

type Props = {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
};

export default function UnsavedPopup(props: Props) {
  const { onClose, onCancel, open } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" />
      <div className="flex items-center justify-center h-screen p-6">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-white dark:bg-gray-900 border border-gray-500 sm:max-h-[200px] sm:w-[450px] py-4 px-4">
          You have unsaved changes. Are you sure you want to exit?
          <div className="flex space-x-4 justify-end mt-12">
            <Button primary onClick={onClose}>
              Yes, exit
            </Button>
            <Button onClick={onCancel}>No, keep editing</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
