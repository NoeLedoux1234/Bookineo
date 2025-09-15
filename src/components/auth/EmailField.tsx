import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import { Mail } from 'lucide-react';

type Props = { id?: string };

export default function EmailField({ id = 'email' }: Props) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Email</Label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="email"
          placeholder="prenom.nom@domaine.com"
          className="pl-9"
        />
      </div>
    </div>
  );
}
