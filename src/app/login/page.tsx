import { AuthLayout } from "@/blocks/layout/AuthLayout";
import { LoginFormSection } from "@/blocks/auth/sections/LoginFormSection";
import { ThemeToggle } from "@/blocks/components/shared/ThemeToggle";

export default function LoginPage() {
  return (
    <>
      <ThemeToggle />
      <AuthLayout
        title="মাসের হিসাব"
        subtitle="Sign in to manage your expenses"
      >
        <LoginFormSection />
      </AuthLayout>
    </>
  );
}
