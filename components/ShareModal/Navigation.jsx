import React from 'react';
import Button from 'components/home/Button';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons';

const Navigation = props => {
  const { backward, forward, withoutIcon } = props;

  return (
    <div className="mt-16 flex items-center justify-between">
      {backward ? (
        <Button onClick={backward.onClick}>
          <IconArrowNarrowLeft />
          {backward?.label ?? 'Back'}
        </Button>
      ) : null}

      {forward ? (
        <Button onClick={forward.onClick} disabled={forward.disabled}>
          {forward.label ?? 'Next'}
          {!forward.withoutIcon && <IconArrowNarrowRight />}
        </Button>
      ) : null}
    </div>
  );
};

export default Navigation;
