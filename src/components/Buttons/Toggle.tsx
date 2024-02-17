type Props = {
  id: string;
  name?: string;
  type?: string;
  value?: string;
  children: React.ReactNode;
  checked?: boolean | undefined;
  className?: string;
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
};

function Toggle({
  children,
  id,
  name,
  type,
  value,
  checked,
  onChange,
  className,
}: Props) {
  return (
    <>
      <input
        className="sr-only"
        type={type || "checkbox"}
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <label className={className} htmlFor={id}>
        {children}
      </label>
    </>
  );
}

export default Toggle;
