import Image from 'next/image';
import logo from 'public/logo.svg';

type Props = {
  width: number;
  height: number;
  className?: string;
};

export default function Logo(props: Props) {
  const { width, height, className = '' } = props;
  return <Image src={logo} width={width} height={height} alt="logo" layout="fixed" className={className} />;
}
