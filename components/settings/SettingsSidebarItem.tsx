import classNames from 'classnames';
import { ForwardedRef, forwardRef, HTMLAttributes, memo } from 'react';

interface SidebarItemProps extends HTMLAttributes<HTMLDivElement> {
  isHighlighted?: boolean;
}

function SettingsSidebarItem(props: SidebarItemProps, forwardedRef: ForwardedRef<HTMLDivElement>) {
  const { children, className = '', isHighlighted, ...otherProps } = props;
  const itemClassName = classNames(
    'w-full overflow-x-hidden overflow-ellipsis whitespace-nowrap text-gray-300 bg-gray-900',
    { '!bg-gray-700': isHighlighted },
    className,
  );
  return (
    <div ref={forwardedRef} className={itemClassName} {...otherProps}>
      {children}
    </div>
  );
}

export default memo(forwardRef(SettingsSidebarItem));
