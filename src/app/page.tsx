
"use client"; // Needs to be a client component to access localStorage

import { useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';

const APP_LOGGED_IN_USER_KEY = "remindme_logged_in_user";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInUser = localStorage.getItem(APP_LOGGED_IN_USER_KEY);
      if (loggedInUser) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [router]);

  // Return null or a loading spinner while redirecting
  return null; 
}
