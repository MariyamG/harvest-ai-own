import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesChart = ({ data, period = 'daily' }) => {
  // If no data is provided, use sample data
  const sampleDailyData = [
    { name: 'Mon', sales: 1200 },
    { name: 'Tue', sales: 1100 },
    { name: 'Wed', sales: 1300 },
    { name: 'Thu', sales: 1400 },
    { name: 'Fri', sales: 1800 },
    { name: 'Sat', sales: 2400 },
    { name: 'Sun', sales: 1600 },
  ];

  const sampleWeeklyData = [
    { name: 'Week 1', sales: 8500 },
    { name: 'Week 2', sales: 9200 },
    { name: 'Week 3', sales: 8700 },
    { name: 'Week 4', sales: 9800 },
  ];

  const sampleMonthlyData = [
    { name: 'Jan', sales: 35000 },
    { name: 'Feb', sales: 32000 },
    { name: 'Mar', sales: 38000 },
    { name: 'Apr', sales: 40000 },
    { name: 'May', sales: 42000 },
    { name: 'Jun', sales: 45000 },
  ];

  // State for period selection
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Determine which data to use
  const chartData = data || (
    selectedPeriod === 'daily' ? sampleDailyData :
    selectedPeriod === 'weekly' ? sampleWeeklyData :
    sampleMonthlyData
  );

  // Format currency
  const formatCurrency = (value) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sales Overview</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod('daily')}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="sales" fill="#3B82F6" name="Sales" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
