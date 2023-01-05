import { useStore } from 'lib/store';
import Toggle from 'components/Toggle';

export default function Appearance() {
  const isPageStackingOn = useStore(state => state.isPageStackingOn);
  const setIsPageStackingOn = useStore(state => state.setIsPageStackingOn);
  // const darkMode = useStore(state => state.darkMode);
  // const setDarkMode = useStore(state => state.setDarkMode);

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Page Stacking</h2>
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
      {/* <hr className="my-4" />
      <h1 className="mb-4 text-lg font-medium">Theme</h1>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Light</span>
        <Toggle className="mx-2" isChecked={darkMode} setIsChecked={setDarkMode} />
        <span className="text-sm text-gray-600 dark:text-gray-300">Dark</span>
      </div> */}
    </div>
  );
}
