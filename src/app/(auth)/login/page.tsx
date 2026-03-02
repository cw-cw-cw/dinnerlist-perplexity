import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand-teal rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">L</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">DinnerList</h1>
        <p className="text-text-muted mt-1">Sign in to manage your events</p>
      </div>
      <LoginForm />
    </div>
  );
}
