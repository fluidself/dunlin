import { ReactNode } from 'react';
import { Node } from 'slate';
import { RenderElementProps, useFocused, useSelected } from 'slate-react';
import classNames from 'classnames';
import { ExternalLink } from 'types/slate';
import Tooltip from 'components/Tooltip';

type ExternalLinkElementProps = {
  element: ExternalLink;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function ExternalLinkElement(props: ExternalLinkElementProps) {
  const { element, children, attributes, className } = props;
  const selected = useSelected();
  const focused = useFocused();
  const linkClassName = classNames(
    'link hover:underline',
    { 'bg-primary-100 dark:bg-primary-900': selected && focused },
    className,
  );
  const linkText = Node.string(element) ?? element.url;

  return (
    <Tooltip content={<span className="break-words">{element.url}</span>} placement="bottom-start">
      <a
        className={linkClassName}
        href={element.url}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          window.open(element.url, '_blank', 'noopener noreferrer');
        }}
        contentEditable={false}
        {...attributes}
      >
        {linkText}
        {children}
      </a>
    </Tooltip>
  );
}
