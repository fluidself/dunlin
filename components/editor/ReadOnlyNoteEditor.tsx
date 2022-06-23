import { memo, useRef, useMemo } from 'react';
import { createEditor, Editor } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';
import { useStore } from 'lib/store';
import withVoidElements from 'editor/plugins/withVoidElements';
import withLinks from 'editor/plugins/withLinks';
import withTags from 'editor/plugins/withTags';
import withImages from 'editor/plugins/withImages';
import withNormalization from 'editor/plugins/withNormalization';
import { getDefaultEditorValue } from 'editor/constants';
import withVerticalSpacing from './elements/withVerticalSpacing';
import EditorElement from './elements/EditorElement';
import EditorLeaf from './elements/EditorLeaf';

type Props = {
  noteId: string;
  className: string;
};

function ReadOnlyNoteEditor(props: Props) {
  const { noteId, className } = props;
  const noteContent = useStore(store => store.notes[noteId].content ?? getDefaultEditorValue());

  const renderElement = useMemo(() => {
    const ElementWithVerticalSpacing = withVerticalSpacing(EditorElement);
    return ElementWithVerticalSpacing;
  }, []);

  const editorRef = useRef<Editor>();
  if (!editorRef.current) {
    editorRef.current = withNormalization(withVoidElements(withImages(withTags(withLinks(withReact(createEditor()))))));
  }
  const editor = editorRef.current;

  return (
    <Slate
      editor={editor}
      value={noteContent}
      onChange={() => {
        /* Do nothing, this is a read only editor */
      }}
    >
      <div contentEditable={false}>
        <Editable className={`overflow-hidden ${className}`} renderElement={renderElement} renderLeaf={EditorLeaf} readOnly />
      </div>
    </Slate>
  );
}

export default memo(ReadOnlyNoteEditor);
