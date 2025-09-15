import AuthLayout from '@/components/auth/AuthLayout';
import EmailField from '@/components/auth/EmailField';
import PasswordField from '@/components/auth/PasswordField';
import RememberMe from '@/components/auth/RememberMe';
import ForgotPasswordLink from '@/components/auth/ForgotPasswordLink';
import Button from '@/components/ui/Button';

export default function Login() {
  return (
    <AuthLayout
      title="Connexion"
      description="Entre ton email et ton mot de passe."
    >
      <EmailField id="login-email" />
      <PasswordField id="login-password" />
      <div className="flex items-center justify-between">
        <RememberMe />
        <ForgotPasswordLink />
      </div>
      <Button className="w-full">Se connecter</Button>
    </AuthLayout>
  );
}
