import { toast } from 'react-toastify';

export default async function copyToClipboard(toCopy: string) {
  await navigator.clipboard.writeText(toCopy);

  toast.success('Copied!');
}
