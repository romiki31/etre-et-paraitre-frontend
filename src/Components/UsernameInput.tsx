interface UsernameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ value, onChange }) => (
  <input placeholder="Pseudo ..." value={value} onChange={onChange} />
);

export default UsernameInput;
