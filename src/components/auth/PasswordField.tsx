import { useState } from 'react';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import { Eye, EyeOff, Lock } from 'lucide-react';

type Props = { id?: string; label?: string; placeholder?: string };

export default function PasswordField({
  id = 'password',
  label = 'Mot de passe',
  placeholder = '••••••••',
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        <button
          type="button"
          aria-label="Afficher le mot de passe"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
