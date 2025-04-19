import { ReactNode } from 'react';
import { RenderElementProps, useFocused, useSelected } from 'slate-react';
import { Image as ImageType } from 'types/slate';
import { isUrl } from 'utils/url';

type ImageElementProps = {
  element: ImageType;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function ImageElement(props: ImageElementProps) {
  const { children, attributes, element, className = '' } = props;
  const selected = useSelected();
  const focused = useFocused();
  const imageSrc = getImageElementUrl(element.url);

  return (
    <div className={className} {...attributes}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        className={`select-none mx-auto max-w-full max-h-full ${
          selected && focused ? 'ring ring-primary-100 dark:ring-primary-900' : ''
        }`}
        contentEditable={false}
        alt={element.caption}
      />
      {children}
    </div>
  );
}

export const getImageElementUrl = (cidOrUrl: string) => {
  return isUrl(cidOrUrl) ? cidOrUrl : `https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${cidOrUrl}`;
};
