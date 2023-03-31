import Image from 'next/image';
import create from 'public/create-logo.svg';
import join from 'public/join-logo.svg';
import { OnboardingStep } from './OnboardingModal';
import { InputType } from './CreateOrAccessWorkspace';

type Props = {
  setCurrentStep: (step: OnboardingStep) => void;
  setInputType: (type: InputType) => void;
};

export default function WorkspaceOptions(props: Props) {
  const { setInputType, setCurrentStep } = props;

  return (
    <div className="flex flex-wrap gap-10 justify-center">
      <button
        className="flex flex-col justify-between items-center py-4 w-[240px] h-[240px] border border-gray-300 cursor-pointer box-border text-white hover:bg-gray-800 hover:border-gray-100 focus:bg-gray-800"
        onClick={() => {
          setInputType(InputType.Create);
          setCurrentStep(OnboardingStep.CreateOrAccess);
        }}
      >
        <Image src={create} width={160} height={160} alt="" priority />
        <div className="font-heading tracking-wider">Create a workspace</div>
      </button>
      <button
        className="flex flex-col justify-between items-center py-4 w-[240px] h-[240px] border border-gray-300 cursor-pointer box-border text-white hover:bg-gray-800 hover:border-gray-100 focus:bg-gray-800"
        onClick={() => {
          setInputType(InputType.Access);
          setCurrentStep(OnboardingStep.CreateOrAccess);
        }}
      >
        <Image src={join} width={160} height={160} alt="" priority />
        <div className="font-heading tracking-wider">Join a workspace</div>
      </button>
    </div>
  );
}
