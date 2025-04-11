import React from 'react';

const ChartCard = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
