"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function AuthHeader() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <>
      <SignInButton mode="modal">
        <button className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
          Sign in
        </button>
      </SignInButton>

      <SignUpButton mode="modal">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
          Sign up
        </button>
      </SignUpButton>
    </>
  );
}