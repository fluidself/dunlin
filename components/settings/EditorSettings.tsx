import { useStore } from 'lib/store';
import Toggle from 'components/Toggle';

export default function EditorSettings() {
  const isPageStackingOn = useStore(state => state.isPageStackingOn);
  const setIsPageStackingOn = useStore(state => state.setIsPageStackingOn);
  const confirmNoteDeletion = useStore(state => state.confirmNoteDeletion);
  const setConfirmNoteDeletion = useStore(state => state.setConfirmNoteDeletion);

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Page stacking</h2>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          If page stacking is on, clicking a note link will open the note on the side, and shift-clicking a note link will open
          the note by itself. If page stacking is off, this behavior is reversed.
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
        <Toggle className="mx-2" id="1" isChecked={isPageStackingOn} setIsChecked={setIsPageStackingOn} />
        <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
      </div>
      <hr className="my-4" />
      <div className="mb-4">
        <h2 className="text-lg font-medium">Confirm note deletion</h2>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">If on, you will be prompted before deleting a note.</p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
        <Toggle className="mx-2" isChecked={confirmNoteDeletion} setIsChecked={setConfirmNoteDeletion} />
        <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
      </div>
    </div>
  );
}
