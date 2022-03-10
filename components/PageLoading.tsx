import Logo from './Logo';

export default function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen space-y-4 dark:bg-gray-900">
      <Logo width={256} height={256} className="animate-pulse" />
    </div>
  );
}
