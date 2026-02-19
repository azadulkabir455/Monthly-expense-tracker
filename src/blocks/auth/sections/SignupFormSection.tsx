"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setLoginStartYear } from "@/hooks/useStartYear";
import {
  signUpWithEmailPassword,
  loginWithGoogle,
  getAuthErrorMessage,
  setSessionCookie,
} from "@/lib/firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/blocks/elements/Card";
import { Button } from "@/blocks/elements/Button";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/blocks/elements/Input";
import { Label } from "@/blocks/elements/Label";
import { SocialLoginButton } from "@/blocks/auth/components/SocialLoginButton";

export function SignupFormSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setError(null);
    setLoading(true);
    try {
      const cred = await signUpWithEmailPassword(email, password);
      const token = await cred.user.getIdToken();
      await setSessionCookie(token);
      setLoginStartYear();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "code" in err
          ? getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0])
          : "Sign up failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const cred = await loginWithGoogle();
      const token = await cred.user.getIdToken();
      await setSessionCookie(token);
      setLoginStartYear();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "code" in err
          ? getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0])
          : "Google sign in failed. Try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Get started with email or continue with Google.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </p>
          )}
          <SocialLoginButton
            provider="google"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          />
          {googleLoading && (
            <p className="text-center text-sm text-muted-foreground">
              Opening Google sign-in...
            </p>
          )}

          <div className="relative">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white px-3 py-0.5 text-xs text-muted-foreground shadow-sm dark:bg-zinc-900">
              or sign up with email
            </span>
            <div className="h-px bg-white/20 dark:bg-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="signup-confirm"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || password !== confirmPassword}
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-400 hover:text-violet-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
