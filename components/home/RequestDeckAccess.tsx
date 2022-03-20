import React, { useState } from 'react';
import { IconX } from '@tabler/icons';
import Button from 'components/home/Button';

type Props = {
  onDeckAccessRequested: (arg0: string) => void;
  onCancel: () => void;
};

const RequestDeckAccess = ({ onDeckAccessRequested, onCancel }: Props) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = () => {
    onDeckAccessRequested(inputValue);
  };

  return (
    <div className="flex">
      <input
        type="text"
        className="input-subdued block w-full px-3 py-1 text-sm"
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        placeholder="Enter DECK ID"
        autoFocus={true}
        autoComplete="off"
      />

      <Button className="mx-2 px-3" disabled={!inputValue} onClick={handleSubmit}>
        Join
      </Button>
      <Button className="px-2" onClick={onCancel}>
        <IconX size={16} />
      </Button>
    </div>
  );
};

export default RequestDeckAccess;
