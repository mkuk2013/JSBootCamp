import React from 'react';

interface JSIconProps {
  className?: string;
}

export const JSIcon: React.FC<JSIconProps> = ({ className = 'h-5 w-5' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} overflow-hidden rounded-md shadow-sm select-none`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" fill="#F7DF1E" />
      <text
        x="22"
        y="21"
        fill="#000000"
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontSize="12.5"
        fontWeight="900"
        textAnchor="end"
        letterSpacing="-0.5px"
      >
        JS
      </text>
    </svg>
  );
};

export default JSIcon;
