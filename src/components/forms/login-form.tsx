"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-button bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger">{state.error}</div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email"
          placeholder="admin@larson.com"
          className="w-full rounded-button border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password"
          placeholder="Enter your password"
          className="w-full rounded-button border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none"
        />
      </div>
      <button type="submit" disabled={isPending}
        className="flex w-full items-center justify-center rounded-button bg-brand-teal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
