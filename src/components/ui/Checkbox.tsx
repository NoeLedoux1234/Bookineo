import * as React from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', indeterminate = false, disabled, ...props }, ref) => {
    const localRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const el =
        (ref && typeof ref !== 'function' ? ref.current : null) ??
        localRef.current;
      if (el) el.indeterminate = indeterminate;
    }, [indeterminate, ref]);

    return (
      <span className="inline-flex items-center">
        <input
          ref={(node) => {
            localRef.current = node;
            if (typeof ref === 'function') ref(node as HTMLInputElement);
            else if (ref)
              (ref as React.MutableRefObject<HTMLInputElement | null>).current =
                node;
          }}
          type="checkbox"
          disabled={disabled}
          className={`h-4 w-4 shrink-0 rounded border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary checked:text-primary-foreground ${className}`}
          {...props}
        />
      </span>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
