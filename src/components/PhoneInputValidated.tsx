import { PhoneInput } from "./PhoneInput";

interface PhoneInputValidatedProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function PhoneInputValidated({ value, onChange, error, placeholder }: PhoneInputValidatedProps) {
  return (
    <PhoneInput
      value={value}
      onChange={(formatted, _isValid, smsFormat) => {
        onChange(smsFormat || formatted);
      }}
      error={error}
      label=""
      placeholder={placeholder}
    />
  );
}

