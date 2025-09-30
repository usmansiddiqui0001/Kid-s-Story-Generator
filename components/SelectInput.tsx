
import React from 'react';

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

const SelectInput: React.FC<SelectInputProps> = ({ label, value, onChange, options }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-600 mb-2">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-white border-2 border-gray-200 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
