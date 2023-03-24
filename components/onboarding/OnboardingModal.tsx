import { Dispatch, SetStateAction, useState, useMemo, useEffect } from 'react';
import { IconX } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import useLitProtocol from 'utils/useLitProtocol';
import WorkspaceOptions from './WorkspaceOptions';
import CreateOrAccessWorkspace, { InputType } from './CreateOrAccessWorkspace';

export enum OnboardingStep {
  Options = 'options',
  CreateOrAccess = 'create-or-access',
}

type OnboardingModalState = {
  isOpen: boolean;
  hasError: boolean;
};

type Props = {
  state: OnboardingModalState;
  setState: Dispatch<SetStateAction<OnboardingModalState>>;
};

export default function OnboardingModal(props: Props) {
  const { state, setState } = props;

  const { isError } = useLitProtocol();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.Options);
  const [inputType, setInputType] = useState<InputType>();

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => setState({ ...state, isOpen: false }),
      },
    ],
    [state, setState],
  );
  useHotkeys(hotkeys);

  useEffect(() => {
    if (isError) {
      setState({ isOpen: false, hasError: true });
    }
  }, [isError, setState]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setState({ ...state, isOpen: false })} />
      <div className="flex items-center justify-center h-screen">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-gray-900 rounded sm:max-h-128 sm:w-[605px] shadow-popover border border-gray-600 text-center pb-8">
          <div className="flex justify-end items-center pr-2 pt-1">
            <button
              className="mr-[-4px] text-gray-300 hover:text-gray-100"
              onClick={() => setState({ ...state, isOpen: false })}
            >
              <IconX size={20} />
            </button>
          </div>
          <h2 className="text-3xl my-12 font-semibold tracking-wider">Welcome to Dunlin</h2>
          {currentStep === OnboardingStep.Options ? (
            <WorkspaceOptions setCurrentStep={setCurrentStep} setInputType={setInputType} />
          ) : null}
          {currentStep === OnboardingStep.CreateOrAccess ? (
            <CreateOrAccessWorkspace setCurrentStep={setCurrentStep} type={inputType} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
