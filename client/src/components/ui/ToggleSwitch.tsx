import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string; // Screen reader label
    color?: string; // Hex color for active state (e.g. #e72289)
    disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    label,
    color = '#22c55e', // Default to Green (tailwindcss green-500) matching the reference image style
    disabled = false
}) => {
    // Dimensions: w-16 (64px) x h-8 (32px) to fit text comfortably
    // Thumb: w-6 h-6 (24px)

    return (
        <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                aria-label={label}
            />
            {/* Track */}
            <div
                className={`
                    w-16 h-8
                    rounded-full 
                    peer 
                    peer-focus:outline-none 
                    peer-focus:ring-4 
                    peer-focus:ring-slate-300/50 
                    transition-colors duration-300 ease-in-out
                    flex items-center relative
                    shadow-inner
                `}
                style={{ backgroundColor: checked ? color : '#d1d5db' }} // #d1d5db is gray-300 (standard OFF gray)
            >
                {/* Text Labels - Absolute positioned to stay in place */}

                {/* ON Text (Left side, visible when checked) */}
                <span
                    className={`
                        absolute left-2 
                        text-white text-[10px] font-bold 
                        transition-opacity duration-300 
                        select-none
                        ${checked ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    ON
                </span>

                {/* OFF Text (Right side, visible when unchecked) */}
                <span
                    className={`
                        absolute right-2 
                        text-white text-[10px] font-bold 
                        transition-opacity duration-300 
                        select-none
                        ${!checked ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    OFF
                </span>

                {/* Thumb (Circle) */}
                <div
                    className={`
                        absolute top-1
                        bg-white 
                        rounded-full 
                        h-6 w-6 
                        shadow-sm
                        transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] /* Bouncy effect */
                        ${checked ? 'translate-x-[36px]' : 'translate-x-[4px]'}
                    `}
                ></div>
            </div>
        </label>
    );
};
