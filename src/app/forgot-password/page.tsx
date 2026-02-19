import { AuthLayout } from "@/blocks/layout/AuthLayout";
import { ForgotPasswordFormSection } from "@/blocks/auth/sections/ForgotPasswordFormSection";
import { ThemeToggle } from "@/blocks/components/shared/ThemeToggle";

export default function ForgotPasswordPage() {
  return (
    <>
      <ThemeToggle />
      <AuthLayout
        title="Reset password"
        subtitle="We&apos;ll send you a reset link"
      >
        <ForgotPasswordFormSection />
      </AuthLayout>
    </>
  );
}
