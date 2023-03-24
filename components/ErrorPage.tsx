import DunlinIcon from './DunlinIcon';

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen space-y-4 bg-gray-900 text-gray-100">
      <DunlinIcon width={64} height={64} />
      <div className="text-lg">Dunlin is currently unavailable. Please try again later.</div>
    </div>
  );
}
