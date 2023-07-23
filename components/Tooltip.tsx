import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { useStore } from 'lib/store';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
};

export default function Tooltip(props: TooltipProps) {
  const { content, children, placement = 'top', delay = 0 } = props;
  const darkMode = useStore(state => state.darkMode);

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={`z-50 overflow-hidden rounded-md max-w-sm px-2 py-1 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${
              darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100'
            }`}
            sideOffset={6}
            side={placement}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
