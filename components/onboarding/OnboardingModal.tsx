import LitJsSdk from 'lit-js-sdk';
import { useState, useEffect, useMemo } from 'react';
import { IconX } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import useIsMounted from 'utils/useIsMounted';
import WorkspaceOptions from './WorkspaceOptions';
import CreateOrAccessWorkspace, { InputType } from './CreateOrAccessWorkspace';

export enum OnboardingStep {
  Options = 'options',
  CreateOrAccess = 'create-or-access',
}

type Props = {
  setIsOpen: (isOpen: boolean) => void;
};

export default function OnboardingModal(props: Props) {
  const { setIsOpen } = props;

  const { user } = useAuth();
  const isMounted = useIsMounted();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.Options);
  const [inputType, setInputType] = useState<InputType>();

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => setIsOpen(false),
      },
    ],
    [setIsOpen],
  );
  useHotkeys(hotkeys);

  useEffect(() => {
    const initLit = async () => {
      const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
      await client.connect();
      window.litNodeClient = client;
    };

    if (!window.litNodeClient && isMounted() && user) {
      initLit();
    }
  }, [isMounted, user]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex items-center justify-center h-screen mt-[-24px]">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-gray-900 rounded sm:max-h-128 sm:w-[605px] shadow-popover border border-gray-600 text-center pb-8">
          <div className="flex justify-end items-center pr-2 pt-1">
            <button className="mr-[-4px] text-gray-300 hover:text-gray-100" onClick={() => setIsOpen(false)}>
              <IconX size={20} />
            </button>
          </div>
          <h2 className="text-3xl my-12 font-semibold tracking-wide">Welcome to Dunlin</h2>
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
