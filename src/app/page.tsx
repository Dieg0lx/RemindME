import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
  // Return null or a loading spinner if redirect takes time,
  // but for server-side redirect, this component might not render.
  return null;
}
