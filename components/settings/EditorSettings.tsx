import { useStore } from 'lib/store';
import Toggle from 'components/Toggle';

export default function EditorSettings() {
  const isPageStackingOn = useStore(state => state.isPageStackingOn);
  const setIsPageStackingOn = useStore(state => state.setIsPageStackingOn);
  const isViewOnlyOn = useStore(state => state.isViewOnlyOn);
  const setIsViewOnlyOn = useStore(state => state.setIsViewOnlyOn);

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
      <div className="mb-4">
        <h1 className="text-lg font-medium">View-only Notes</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          If view-only is on, notes can only be edited by their original author and the DECK owner.
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
        <Toggle className="mx-2" isChecked={isViewOnlyOn} setIsChecked={setIsViewOnlyOn} />
        <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
      </div>
      <hr className="my-4" />
      <div className="mb-4">
        <h1 className="text-lg font-medium">Page Stacking</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          If page stacking is on, clicking a note link will open the note on the side, and shift-clicking a note link will open
          the note by itself. If page stacking is off, this behavior is reversed.
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
        <Toggle className="mx-2" isChecked={isPageStackingOn} setIsChecked={setIsPageStackingOn} />
        <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
      </div>
    </div>
  );
}
