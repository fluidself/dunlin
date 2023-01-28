import { type ReactNode, useState, useMemo } from 'react';
import { RenderElementProps, useFocused, useSelected } from 'slate-react';
import type { RichTypeData, VideoTypeData } from '@extractus/oembed-extractor';
import type { Embed } from 'types/slate';
import HtmlInjection from './HtmlInjection';

type EmbedElementProps = {
  element: Embed;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function EmbedElement(props: EmbedElementProps) {
  const { children, attributes, element, className = '' } = props;
  const { url, oembed } = element;
  const selected = useSelected();
  const focused = useFocused();
  const [isInvalid, setIsInvalid] = useState(false);

  const oembedData = useMemo(
    () =>
      oembed && (oembed.type === 'rich' || oembed.type === 'video') ? (oembed as RichTypeData | VideoTypeData) : null,
    [oembed],
  );

  return (
    <div className={className} {...attributes}>
      <div className={`${selected && focused ? 'ring ring-primary-100 dark:ring-primary-900' : ''}`}>
        <div contentEditable={false}>
          {isInvalid ? <div>There was a problem loading the requested URL.</div> : null}
          {!isInvalid && oembedData ? (
            <HtmlInjection html={oembedData.html ?? ''} onError={() => setIsInvalid(true)} />
          ) : null}
          {!isInvalid && !oembedData && url ? (
            /* 16:9 aspect ratio */
            <div className="relative pb-[56.25%]">
              <iframe
                src={element.url}
                onError={() => setIsInvalid(true)}
                title={`iframe ${element.url}`}
                className={`absolute top-0 left-0 select-none w-full h-full bg-white ${
                  selected && focused ? 'ring ring-primary-100 dark:ring-primary-900' : ''
                }`}
                loading="lazy"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
