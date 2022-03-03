import React from 'react';
import Button from '../Button';
import { ArrowLeft } from './icons';

const Navigation = (props: any) => {
  const { backward, forward } = props;

  return (
    <div className="mt-12 flex items-center space-between">
      {backward ? (
        <Button onClick={backward.onClick}>
          <ArrowLeft />
          Back
        </Button>
      ) : null}
      {forward ? <Button onClick={forward.onClick}>Next</Button> : null}
    </div>
  );
};

export default Navigation;
