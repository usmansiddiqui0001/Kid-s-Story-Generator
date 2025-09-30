import React from 'react';

interface ImageToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ImageToggle: React.FC<ImageToggleProps> = ({ label, enabled, onChange }) => {
  return (
    <div className="flex items-center justify-center space-x-3">
      <label className="block text-sm font-bold text-gray-600">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${
          enabled ? 'bg-teal-500' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};

export default ImageToggle;
