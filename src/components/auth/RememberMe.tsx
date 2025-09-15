import Checkbox from '@/components/ui/Checkbox';
import Label from '@/components/ui/Label';

type Props = { id?: string };

export default function RememberMe({ id = 'remember' }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} />
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        Se souvenir de moi
      </Label>
    </div>
  );
}
