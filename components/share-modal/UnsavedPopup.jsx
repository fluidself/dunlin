import React from 'react';
import Button from 'components/home/Button';

const UnsavedPopup = props => {
  const { onClose, onCancel, open } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" />
      <div className="flex items-center justify-center h-screen p-6">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-background border border-gray-500 sm:max-h-[200px] sm:w-[450px] py-4 px-4">
          You have unsaved changes. Are you sure you want to exit?
          <div className="flex justify-between mt-12">
            <Button onClick={onCancel}>No, keep editing</Button>
            <Button onClick={onClose}>Yes, exit</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsavedPopup;
