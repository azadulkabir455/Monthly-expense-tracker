import { AuthLayout } from "@/blocks/layout/AuthLayout";
import { SignupFormSection } from "@/blocks/sections/SignupFormSection";
import { ThemeToggle } from "@/blocks/components/ThemeToggle";

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
