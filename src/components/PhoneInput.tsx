import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  formatPhoneAsTyping, 
  validatePhoneNumber, 
  formatPhoneForSMS,
  formatPhoneForDisplay,
  PHONE_CONSTANTS 
} from '@/lib/phoneUtils';
import { Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string, isValid: boolean, formattedForSMS: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showValidation?: boolean;
  showSMSFormat?: boolean;
  className?: string;
  error?: string;
  autoComplete?: string;
  name?: string;
  id?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value = '',
  onChange,
  onValidationChange,
  label = 'Phone Number',
  placeholder = PHONE_CONSTANTS.PLACEHOLDER,
  required = false,
  disabled = false,
  showValidation = true,
  showSMSFormat = false,
  className,
  error: externalError,
  autoComplete = 'tel',
  name = 'phone',
  id,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [validation, setValidation] = useState<ReturnType<typeof validatePhoneNumber>>({ isValid: false });
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  // Update display value when external value changes
  useEffect(() => {
    if (value !== displayValue) {
      setDisplayValue(formatPhoneForDisplay(value));
    }
  }, [value]);

  // Validate on value change
  useEffect(() => {
    const validationResult = validatePhoneNumber(displayValue);
    setValidation(validationResult);
    
    if (onValidationChange) {
      onValidationChange(validationResult.isValid, validationResult.error);
    }
  }, [displayValue, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Format as user types
    const formatted = formatPhoneAsTyping(inputValue);
    setDisplayValue(formatted);
    
    // Validate and call onChange
    const validationResult = validatePhoneNumber(formatted);
    const smsFormat = validationResult.isValid ? formatPhoneForSMS(formatted) : '';
    
    if (onChange) {
      onChange(formatted, validationResult.isValid, smsFormat);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBlurred(true);
  };

  const showError = (externalError || (hasBlurred && !isFocused && validation.error)) && showValidation;
  const showSuccess = validation.isValid && hasBlurred && !isFocused && showValidation;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id || name} className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={ref}
          id={id || name}
          name={name}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={PHONE_CONSTANTS.MAX_LENGTH}
          className={cn(
            'pl-10',
            showError && 'border-red-500 focus:border-red-500',
            showSuccess && 'border-green-500 focus:border-green-500'
          )}
          {...props}
        />
        
        {/* Phone icon */}
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        {/* Validation icons */}
        {showValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showSuccess && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {showError && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* SMS format display */}
      {showSMSFormat && validation.isValid && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="outline" className="text-xs">
            SMS Format: {formatPhoneForSMS(displayValue)}
          </Badge>
        </div>
      )}

      {/* Error message */}
      {showError && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {externalError || validation.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Help text */}
      {!showError && !showSuccess && (
        <p className="text-xs text-gray-500">
          Enter a US phone number (10 digits)
        </p>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

// Simplified phone input for forms where you just need the value
interface SimplePhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimplePhoneInput({ 
  value, 
  onChange, 
  placeholder = PHONE_CONSTANTS.PLACEHOLDER,
  disabled = false,
  className 
}: SimplePhoneInputProps) {
  return (
    <PhoneInput
      value={value}
      onChange={(formattedValue) => onChange(formattedValue)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      showValidation={false}
      label=""
    />
  );
}

// Phone input with validation for forms
interface ValidatedPhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function ValidatedPhoneInput({
  value,
  onChange,
  label = 'Phone Number',
  required = false,
  error,
  className
}: ValidatedPhoneInputProps) {
  return (
    <PhoneInput
      value={value}
      onChange={(formattedValue, isValid) => onChange(formattedValue, isValid)}
      label={label}
      required={required}
      error={error}
      className={className}
      showValidation={true}
      showSMSFormat={true}
    />
  );
}

// Phone input specifically for SMS/crisis contacts
interface CrisisContactPhoneInputProps {
  value: string;
  onChange: (value: string, smsFormat: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export function CrisisContactPhoneInput({
  value,
  onChange,
  label = 'Emergency Contact Phone',
  required = true,
  className
}: CrisisContactPhoneInputProps) {
  const [isValid, setIsValid] = useState(false);

  return (
    <div className={className}>
      <PhoneInput
        value={value}
        onChange={(formattedValue, valid, smsFormat) => {
          setIsValid(valid);
          onChange(formattedValue, smsFormat);
        }}
        label={label}
        required={required}
        showValidation={true}
        showSMSFormat={true}
      />
      
      {isValid && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✅ This number is ready for SMS crisis alerts
        </div>
      )}
    </div>
  );
}

export default PhoneInput;