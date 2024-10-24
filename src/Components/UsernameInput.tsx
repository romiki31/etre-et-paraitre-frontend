interface UsernameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ value, onChange }) => (
  <>
    <input
      className="w-66 internal-input"
      placeholder="Pseudo ..."
      value={value}
      onChange={onChange}
      autoFocus
    />
  </>
);

export default UsernameInput;
