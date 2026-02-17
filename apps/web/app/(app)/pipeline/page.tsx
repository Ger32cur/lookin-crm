import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { PipelineBoard } from './pipeline-board';

export default function PipelinePage() {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  return <PipelineBoard token={token} />;
}
