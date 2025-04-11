import React from 'react';

const InventoryItem = ({ item, onEdit, onReorder }) => {
  // Determine status color based on quantity vs par level
  const getStatusColor = () => {
    const ratio = item.quantity / item.par_level;
    if (ratio <= 0.2) return 'bg-red-100 text-red-800 border-red-200';
    if (ratio <= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Format expiry date
  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

  return (
    <div className={`rounded-lg shadow-md p-4 mb-3 border ${getStatusColor()}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-lg">{item.item_name}</h4>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span>Quantity: {item.quantity}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Par Level: {item.par_level}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>${item.unit_cost.toFixed(2)}/unit</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Expires: {formatExpiryDate(item.expiry_date)}</span>
            </div>
          </div>
          {daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
            <p className="mt-2 text-sm font-medium text-red-600">
              {daysUntilExpiry <= 0 
                ? 'Expired!' 
                : `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}!`}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(item.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onReorder(item.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryItem;
