import { useState, ReactNode, MouseEventHandler, useRef, useCallback } from 'react';
import { usePopper } from 'react-popper';
import { Menu } from '@headlessui/react';
import { Placement } from '@popperjs/core';
import Portal from './Portal';
import Tooltip, { type TooltipPlacement } from './Tooltip';

type Props = {
  buttonChildren: ReactNode;
  children: ReactNode;
  buttonClassName?: string;
  itemsClassName?: string;
  placement?: Placement;
  offset?: [number | null | undefined, number | null | undefined];
  tooltipContent?: ReactNode;
  tooltipPlacement?: TooltipPlacement;
};

export default function Dropdown(props: Props) {
  const {
    buttonChildren,
    children,
    buttonClassName = '',
    itemsClassName = '',
    placement,
    offset,
    tooltipContent,
    tooltipPlacement,
  } = props;

  const referenceElementRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElementRef.current, popperElement, {
    placement,
    modifiers: [{ name: 'offset', options: { offset } }],
  });

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button ref={referenceElementRef} className={buttonClassName} contentEditable={false}>
            <Tooltip content={tooltipContent} placement={tooltipPlacement} delay={200}>
              <span>{buttonChildren}</span>
            </Tooltip>
          </Menu.Button>
          {open && (
            <Portal>
              <Menu.Items
                ref={setPopperElement}
                className={`z-20 w-52 overflow-hidden text-sm bg-white rounded shadow-popover dark:bg-gray-800 focus:outline-none ${itemsClassName}`}
                static
                style={styles.popper}
                {...attributes.popper}
              >
                {children}
              </Menu.Items>
            </Portal>
          )}
        </>
      )}
    </Menu>
  );
}

type DropdownItemProps =
  | {
      children: ReactNode;
      onClick: MouseEventHandler<HTMLButtonElement>;
      as?: 'button';
      className?: string;
      disabled?: boolean;
    }
  | {
      children: ReactNode;
      href: string;
      rel?: string;
      target?: string;
      as: 'a';
      className?: string;
      disabled?: boolean;
    };

export function DropdownItem(props: DropdownItemProps) {
  const { children, className = '', disabled } = props;

  const itemClassName = useCallback(
    (active: boolean, disabled?: boolean) =>
      `flex w-full items-center px-4 py-2 text-left text-sm select-none ${
        active && !disabled ? 'bg-gray-100 dark:bg-gray-700' : ''
      } ${
        disabled ? 'text-gray-300 dark:text-gray-500 pointer-events-none' : 'text-gray-800 dark:text-gray-200'
      } ${className}`,
    [className],
  );

  return (
    <Menu.Item>
      {({ active }) =>
        props.as === 'a' ? (
          <a className={itemClassName(active, disabled)} href={props.href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ) : (
          <button className={itemClassName(active, disabled)} onClick={props.onClick} disabled={disabled}>
            {children}
          </button>
        )
      }
    </Menu.Item>
  );
}
