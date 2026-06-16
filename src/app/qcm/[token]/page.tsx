import QcmRunner from './QcmRunner';

export default function QcmPage({ params }: { params: { token: string } }) {
  return <QcmRunner token={params.token} />;
}
