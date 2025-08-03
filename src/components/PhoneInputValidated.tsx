import { PhoneInput } from "./PhoneInput";

interface PhoneInputValidatedProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInputValidated({ value, onChange, error }: PhoneInputValidatedProps) {
  return (
    <PhoneInput
      value={value}
      onChange={(formatted, _isValid, smsFormat) => {
        onChange(smsFormat || formatted);
      }}
      error={error}
      label=""
    />
  );
}

