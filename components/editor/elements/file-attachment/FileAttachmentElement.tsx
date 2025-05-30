import { decryptFile } from '@lit-protocol/encryption';
import { ReactNode, useState } from 'react';
import { RenderElementProps, useFocused, useReadOnly, useSelected } from 'slate-react';
import { IconCode, IconDownload } from '@tabler/icons';
import { decodeBase64 } from 'tweetnacl-util';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import { FileAttachment } from 'types/slate';
import { useStore } from 'lib/store';
import { formatBytes } from 'utils/string';
import Tooltip from 'components/Tooltip';
import Button from 'components/Button';
import FileAttachmentMenu from './FileAttachmentMenu';

type FileAttachmentElementProps = {
  element: FileAttachment;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function FileAttachmentElement(props: FileAttachmentElementProps) {
  const { children, attributes, element, className = '' } = props;
  const { file, description } = element;
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  const isOffline = useStore(state => state.isOffline);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDownload = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${file.cid}`);
      const encryptedFile = await res.blob();
      if (!encryptedFile) throw new Error('Could not retrieve file at given CID');

      const symmetricKey = decodeBase64(file.symmKey);
      const decryptedFile = await decryptFile({ file: encryptedFile, symmetricKey });
      const blob = new Blob([decryptedFile]);

      saveAs(blob, `${file.filename}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : e;
      console.error(`File download error: ${message}`);
      toast.error('There was an error downloading the file');
    }
    setProcessing(false);
  };

  return (
    <div className={className} {...attributes}>
      <div
        className={`group border ${
          selected && focused && !isMenuOpen
            ? 'ring ring-primary-100 dark:ring-primary-900 border-transparent'
            : 'border-gray-400 dark:border-gray-600'
        }`}
        contentEditable={false}
      >
        {!readOnly ? (
          <Tooltip content="Attachment settings" placement="top">
            <button
              className="opacity-0.1 group-hover:opacity-100 float-right p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 dark:active:bg-gray-500 focus:outline-none"
              onClick={() => setMenuOpen(!isMenuOpen)}
            >
              <IconCode size={18} />
            </button>
          </Tooltip>
        ) : null}
        <div className="flex items-center justify-center p-3">
          <Button className="ml-3 mr-6 !px-2 rounded-sm" disabled={isOffline || processing} onClick={handleDownload}>
            <IconDownload size={24} />
          </Button>
          <div className="flex-1 cursor-default">
            <div className="font-semibold">{file.filename}</div>
            <div className="text-sm">
              {element.description ? (
                <>
                  {description} - {formatBytes(file.size)}
                </>
              ) : (
                formatBytes(file.size)
              )}
            </div>
          </div>
        </div>
        {isMenuOpen ? <FileAttachmentMenu element={element} onClose={() => setMenuOpen(false)} /> : null}
      </div>
      {children}
    </div>
  );
}
