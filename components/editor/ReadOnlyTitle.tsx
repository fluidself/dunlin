import { memo, useEffect, useRef } from 'react';
import { store } from 'lib/store';

type Props = {
  noteId: string;
  className?: string;
};

function ReadOnlyTitle(props: Props) {
  const { noteId, className = '' } = props;
  const titleRef = useRef<HTMLDivElement | null>(null);

  // Set the title
  useEffect(() => {
    if (!titleRef.current || titleRef.current.textContent) {
      return;
    }
    const value = store.getState().notes[noteId]?.title ?? '';
    titleRef.current.textContent = value;
  }, [noteId]);

  return (
    <>
      <div
        ref={titleRef}
        className={`title text-3xl md:text-4xl font-semibold border-none focus:outline-none p-0 leading-tight cursor-text ${className}`}
        placeholder="Untitled"
        contentEditable={false}
      />
      <style jsx>{`
        .title[placeholder]:empty:before {
          content: attr(placeholder);
          color: #d1d5db;
        }
      `}</style>
    </>
  );
}

export default memo(ReadOnlyTitle);
