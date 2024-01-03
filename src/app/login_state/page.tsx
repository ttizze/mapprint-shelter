'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <main>
      <div>
        <p>Hello&nbsp;<code>{session?.user?.name ?? 'guest'}</code></p>
        {!session && (
          <button onClick={() => signIn()}>Sign In</button>
        )}
        {session && (
          <button onClick={() => signOut()}>Sign Out</button>
        )}      
        </div>
    </main>
  );
}
