type Props = {
  id?: string;
  name?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?:
    | ((e: React.FormEvent<HTMLButtonElement>) => void)
    | ((e: React.MouseEvent<HTMLButtonElement>) => void);
};

function TransportButton({ children, ...props }: Props) {
  return (
    <button className="transport-button" {...props}>
      {children}
    </button>
  );
}

export default TransportButton;
