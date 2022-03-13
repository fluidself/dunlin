import Button from 'components/Button';
import React, { useState } from 'react';
import InputWrapper from '../InputWrapper';

const ProvideString = ({ onStringProvided, setActiveStep }) => {
  const [providedString, setProvidedString] = useState('');

  const handleSubmit = () => {
    onStringProvided(providedString);
    setActiveStep('ableToAccess');
  };

  return (
    <div>
      <h4 className="text-lg">Provide a secret string for sharing your DECK</h4>
      <InputWrapper
        value={providedString}
        className="mt-12"
        label="Provide a string"
        id="providedString"
        autoFocus
        handleChange={value => setProvidedString(value)}
      />

      <Button className="float-right mt-4" disabled={!providedString} onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
};

export default ProvideString;
