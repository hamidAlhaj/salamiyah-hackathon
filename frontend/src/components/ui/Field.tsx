import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/** The one control style (inputs, textareas, selects). 16px text also stops iOS zooming on focus. */
export const controlClass =
  'block w-full rounded-xl border border-control bg-surface px-3.5 py-2.5 text-base text-ink shadow-card ' +
  'transition duration-150 placeholder:text-muted/70 focus:border-brand-600 focus:outline-none ' +
  'focus:ring-2 focus:ring-ring/30 disabled:opacity-60';

export const labelClass = 'block text-sm font-medium text-ink';

type Common = {
  label: string;
  name: string;
  id?: string;
  /** Help text under the control (linked with aria-describedby). */
  hint?: string;
  /** Inline error for this control (aria-invalid + aria-describedby). */
  error?: string;
  className?: string;
};

type InputFieldProps = Common & { as?: 'input' } & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'name' | 'id' | 'className'
  >;
type TextareaFieldProps = Common & { as: 'textarea' } & Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'name' | 'id' | 'className'
  >;
type SelectFieldProps = Common & { as: 'select'; children: ReactNode } & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'name' | 'id' | 'className'
  >;

export type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

/** Label + control + hint/error, shared by every form. */
export function Field(props: FieldProps) {
  const { label, name, id, hint, error, className = '' } = props;
  const fieldId = id ?? name;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const shared = {
    id: fieldId,
    name,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
    className: `${controlClass} ${error ? 'border-danger' : ''} ${className}`,
  };

  // Everything that is not a Field prop goes to the control element.
  const rest: Record<string, unknown> = { ...props };
  for (const key of ['as', 'label', 'name', 'id', 'hint', 'error', 'className', 'children'])
    delete rest[key];

  let control: ReactNode;
  if (props.as === 'textarea') {
    control = <textarea {...shared} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />;
  } else if (props.as === 'select') {
    control = (
      <select {...shared} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
        {props.children}
      </select>
    );
  } else {
    control = <input {...shared} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />;
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
