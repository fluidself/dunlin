import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'lib/store';
import Toggle from 'components/Toggle';
import Button from 'components/home/Button';

export default function EditorSettings() {
  const isViewOnlyOn = useStore(state => state.isViewOnlyOn);
  const isAuthorControlOn = useStore(state => state.isAuthorControlOn);
  const setIsViewOnlyOn = useStore(state => state.setIsViewOnlyOn);
  const setIsAuthorControlOn = useStore(state => state.setIsAuthorControlOn);

  const [viewOnly, setViewOnly] = useState(isViewOnlyOn);
  const [authorControl, setAuthorControl] = useState(isAuthorControlOn);
  const [hasChanges, setHasChanges] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (viewOnly !== isViewOnlyOn || authorControl !== isAuthorControlOn) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [isViewOnlyOn, isAuthorControlOn, viewOnly, authorControl]);

  const onSaveChanges = useCallback(async () => {
    setProcessing(true);
    // read local state vars
    // await supabase changes
    // set store vars
    setProcessing(false);
  }, []);

  return (
    <div className="flex-1 w-full h-full p-6 flex flex-col justify-between overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-medium">View-only Notes</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            If on, notes can only be edited by their original author and the DECK owner.
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
          <Toggle className="mx-2" id="2" isChecked={viewOnly} setIsChecked={setViewOnly} />
          <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
        </div>
        {viewOnly && (
          <>
            <div className="my-4">
              <h4 className="text-sm font-medium">Allow Note Author Control</h4>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                If on, DECK members can toggle view-only status for their own notes.
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
              <Toggle className="mx-2" id="3" isChecked={authorControl} setIsChecked={setAuthorControl} />
              <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
            </div>
          </>
        )}
      </div>
      <div className={`flex justify-end ${!hasChanges && 'hidden'}`}>
        <Button primary disabled={processing} onClick={onSaveChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
