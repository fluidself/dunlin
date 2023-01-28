import { ReactNode } from 'react';
import { RenderElementProps, useFocused, useSelected } from 'slate-react';
import type { Video } from 'types/slate';

type VideoElementProps = {
  element: Video;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function VideoElement(props: VideoElementProps) {
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
          title={`video player ${element.url}`}
          className={`absolute top-0 left-0 w-full h-full select-none ${
            selected && focused ? 'ring ring-primary-100 dark:ring-primary-900' : ''
          }`}
          loading="lazy"
          allowFullScreen
        />
        {children}
      </div>
    </div>
  );
}
