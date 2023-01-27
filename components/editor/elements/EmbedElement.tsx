import { ReactNode } from 'react';
import { RenderElementProps, useFocused, useSelected } from 'slate-react';
import { Embed } from 'types/slate';

type EmbedElementProps = {
  element: Embed;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function EmbedElement(props: EmbedElementProps) {
  const { children, attributes, element, className = '' } = props;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <div className={className} {...attributes}>
      {/* 16:9 aspect ratio */}
      <div className="relative pb-[56.25%]">
        <iframe
          src={element.url}
          contentEditable={false}
          allowFullScreen
          title="Embedded iframe"
          className={`absolute top-0 left-0 select-none w-full h-full bg-white ${
            selected && focused ? 'ring ring-primary-100 dark:ring-primary-900' : ''
          }`}
        />
        {children}
      </div>
    </div>
  );
}
