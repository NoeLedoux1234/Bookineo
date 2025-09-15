import AuthLayout from '@/components/auth/AuthLayout';
import EmailField from '@/components/auth/EmailField';
import PasswordField from '@/components/auth/PasswordField';
import Button from '@/components/ui/Button';

export default function Register() {
  return (
    <AuthLayout
      title="Créer un compte"
      description="Renseigne les informations ci-dessous."
    >
      <EmailField id="register-email" />
      <PasswordField
        id="register-password"
        label="Mot de passe"
        placeholder="Au moins 8 caractères"
      />
      <PasswordField
        id="register-password2"
        label="Confirmer le mot de passe"
        placeholder="Répéter le mot de passe"
      />
      <Button className="w-full">Créer le compte</Button>
    </AuthLayout>
  );
}
