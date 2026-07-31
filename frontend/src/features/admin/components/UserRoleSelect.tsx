import { forwardRef, type SelectHTMLAttributes } from 'react';
import { SelectField } from '@/components/FormField';
import { ALL_ROLES } from '@/types/api';
import { humanizeEnum } from '@/lib/format';

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const UserRoleSelect = forwardRef<HTMLSelectElement, Props>(function UserRoleSelect(
  { label = 'Role', ...rest },
  ref,
) {
  return (
    <SelectField ref={ref} label={label} {...rest}>
      {ALL_ROLES.map((r) => (
        <option key={r} value={r}>
          {humanizeEnum(r)}
        </option>
      ))}
    </SelectField>
  );
});
