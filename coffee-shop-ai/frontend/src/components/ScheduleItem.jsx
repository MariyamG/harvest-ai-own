import React from 'react';

const ScheduleItem = ({ staff, shift, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-lg">{staff.name}</h4>
          <p className="text-gray-600">{staff.role}</p>
          <div className="mt-2 flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{shift.start} - {shift.end}</span>
          </div>
          {shift.notes && (
            <p className="mt-2 text-sm text-gray-500">{shift.notes}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(staff.id, shift)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(staff.id, shift)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleItem;
