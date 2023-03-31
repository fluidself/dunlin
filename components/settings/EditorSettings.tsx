import { useStore } from 'lib/store';
import Toggle from 'components/Toggle';

export default function EditorSettings() {
  const darkMode = useStore(state => state.darkMode);
  const setDarkMode = useStore(state => state.setDarkMode);
  const isPageStackingOn = useStore(state => state.isPageStackingOn);
  const setIsPageStackingOn = useStore(state => state.setIsPageStackingOn);
  const confirmNoteDeletion = useStore(state => state.confirmNoteDeletion);
  const setConfirmNoteDeletion = useStore(state => state.setConfirmNoteDeletion);

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto dark:bg-gray-900 dark:text-gray-100">
      <h2 className="mb-4 text-lg font-heading tracking-wide">Theme</h2>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Light</span>
        <Toggle className="mx-2" id="1" isChecked={darkMode} setIsChecked={setDarkMode} />
        <span className="text-sm text-gray-600 dark:text-gray-300">Dark</span>
      </div>
      <hr className="my-4" />
      <div className="mb-4">
        <h2 className="text-lg font-heading tracking-wide">Page stacking</h2>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          If page stacking is on, clicking a note link will open the note on the side, and shift-clicking a note link
          will open the note by itself. If page stacking is off, this behavior is reversed.
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
        <Toggle className="mx-2" id="2" isChecked={isPageStackingOn} setIsChecked={setIsPageStackingOn} />
        <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
      </div>
      <hr className="my-4" />
      <div className="mb-4">
        <h2 className="text-lg font-heading tracking-wide">Confirm note deletion</h2>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          If on, you will be prompted before deleting a note.
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
        <Toggle className="mx-2" id="3" isChecked={confirmNoteDeletion} setIsChecked={setConfirmNoteDeletion} />
        <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
      </div>
    </div>
  );
}
