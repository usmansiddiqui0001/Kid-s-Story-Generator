import React from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, min, max }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-600 mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        className="w-full bg-white border-2 border-gray-200 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
      />
    </div>
  );
};

export default NumberInput;
