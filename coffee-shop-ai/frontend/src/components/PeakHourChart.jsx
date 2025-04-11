import React, { useState } from 'react';

const PeakHourChart = ({ data }) => {
  // If no data is provided, use sample data
  const chartData = data || [
    { hour: 6, day_of_week: 1, predicted_customers: 10 },
    { hour: 7, day_of_week: 1, predicted_customers: 15 },
    { hour: 8, day_of_week: 1, predicted_customers: 35 },
    { hour: 9, day_of_week: 1, predicted_customers: 45 },
    { hour: 10, day_of_week: 1, predicted_customers: 30 },
    { hour: 11, day_of_week: 1, predicted_customers: 25 },
    { hour: 12, day_of_week: 1, predicted_customers: 40 },
    { hour: 13, day_of_week: 1, predicted_customers: 35 },
    { hour: 14, day_of_week: 1, predicted_customers: 20 },
    { hour: 15, day_of_week: 1, predicted_customers: 15 },
    { hour: 16, day_of_week: 1, predicted_customers: 25 },
    { hour: 17, day_of_week: 1, predicted_customers: 30 },
    { hour: 18, day_of_week: 1, predicted_customers: 35 },
    { hour: 19, day_of_week: 1, predicted_customers: 25 },
    { hour: 20, day_of_week: 1, predicted_customers: 15 },
    { hour: 21, day_of_week: 1, predicted_customers: 10 },
  ];

  // Find the maximum value for scaling
  const maxCustomers = Math.max(...chartData.map(d => d.predicted_customers));
  
  // Days of the week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // State for selected day
  const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
  
  // Filter data for selected day
  const filteredData = chartData.filter(d => d.day_of_week === selectedDay);

  return (
    <div className="w-full">
      <div className="mb-4">
        <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Day:
        </label>
        <select
          id="day-select"
          value={selectedDay}
          onChange={(e) => setSelectedDay(parseInt(e.target.value))}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {daysOfWeek.map((day, index) => (
            <option key={index} value={index}>
              {day}
            </option>
          ))}
        </select>
      </div>
      
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxCustomers}</span>
          <span>{Math.round(maxCustomers * 0.75)}</span>
          <span>{Math.round(maxCustomers * 0.5)}</span>
          <span>{Math.round(maxCustomers * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-10 h-full flex items-end">
          {filteredData.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t"
                style={{ 
                  height: `${(d.predicted_customers / maxCustomers) * 100}%`,
                  maxWidth: '30px',
                  margin: '0 auto'
                }}
              ></div>
              <span className="text-xs mt-1">{d.hour}:00</span>
            </div>
          ))}
        </div>
        
        {/* Horizontal grid lines */}
        <div className="absolute left-10 right-0 top-0 bottom-0 pointer-events-none">
          <div className="border-t border-gray-200 h-1/4"></div>
          <div className="border-t border-gray-200 h-1/4"></div>
          <div className="border-t border-gray-200 h-1/4"></div>
          <div className="border-t border-gray-200 h-1/4"></div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Hour of Day
      </div>
    </div>
  );
};

export default PeakHourChart;
