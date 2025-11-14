'use client';

import { useState, useRef, useEffect } from 'react';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function Combobox({ options, value, onChange, placeholder = '', label, disabled = false }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value);
    setInputValue(selectedOption ? selectedOption.label : '');
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedOption = options.find(opt => opt.value === value);
        setInputValue(selectedOption ? selectedOption.label : '');
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setInputValue(option.label);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-700"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-900 ${
                option.value === value ? 'bg-blue-50 font-semibold' : ''
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
