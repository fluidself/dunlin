import React from 'react';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons';
import Button from 'components/home/Button';

type Props = {
  backward?: {
    label?: string;
    onClick: () => void;
  };
  forward?: {
    label: string;
    onClick: () => Promise<void>;
    withoutIcon: boolean;
    disabled: boolean;
    loading: boolean;
  };
};

export default function Navigation(props: Props) {
  const { backward, forward } = props;

  return (
    <div className="mt-16 flex items-center justify-between">
      {backward ? (
        <Button onClick={backward.onClick}>
          <IconArrowNarrowLeft />
          {backward?.label ?? 'Back'}
        </Button>
      ) : null}

      {forward ? (
        <Button onClick={forward.onClick} disabled={forward.disabled} loading={forward.loading} primary={forward.withoutIcon}>
          {forward.label ?? 'Next'}
          {!forward.withoutIcon && <IconArrowNarrowRight />}
        </Button>
      ) : null}
    </div>
  );
}
