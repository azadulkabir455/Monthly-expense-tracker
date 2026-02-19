import { AuthLayout } from "@/blocks/layout/AuthLayout";
import { SignupFormSection } from "@/blocks/auth/sections/SignupFormSection";
import { ThemeToggle } from "@/blocks/components/shared/ThemeToggle";

export default function SignupPage() {
  return (
    <>
      <ThemeToggle />
      <AuthLayout
        title="Create account"
        subtitle="Start tracking your monthly expenses"
      >
        <SignupFormSection />
      </AuthLayout>
    </>
  );
}
