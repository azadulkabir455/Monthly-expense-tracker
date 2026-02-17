import { AuthLayout } from "@/blocks/layout/AuthLayout";
import { LoginFormSection } from "@/blocks/sections/LoginFormSection";
import { ThemeToggle } from "@/blocks/components/ThemeToggle";

export default function LoginPage() {
  return (
    <>
      <ThemeToggle />
      <AuthLayout
        title="Monthly Expense Tracker"
        subtitle="Sign in to manage your expenses"
      >
        <LoginFormSection />
      </AuthLayout>
    </>
  );
}
