import React, { useState } from 'react';
import { IconX } from '@tabler/icons';
import Button from 'components/home/Button';

type Props = {
  onDeckNameProvided: (arg0: string) => void;
  onCancel: () => void;
};

const RequestDeckAccess = ({ onDeckNameProvided, onCancel }: Props) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = () => {
    onDeckNameProvided(inputValue);
  };

  return (
    <div className="flex">
      <input
        type="text"
        className="input block w-full px-3 py-1 text-sm border bg-inherit border-gray-400"
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        placeholder="Enter DECK name"
        autoFocus={true}
        autoComplete="off"
        maxLength={20}
      />

      <Button className="mx-2 px-3" disabled={!inputValue} onClick={handleSubmit}>
        Create
      </Button>
      <Button className="px-2" onClick={onCancel}>
        <IconX size={16} />
      </Button>
    </div>
  );
};

export default RequestDeckAccess;
