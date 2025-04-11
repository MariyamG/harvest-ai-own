import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardCard from '../components/DashboardCard';
import ChartCard from '../components/ChartCard';
import SuggestionCard from '../components/SuggestionCard';
import PeakHourChart from '../components/PeakHourChart';
import SalesChart from '../components/SalesChart';

const Dashboard = () => {
  const { 
    loading, 
    salesData, 
    suggestions, 
    peakHourForecast,
    fetchSalesData,
    fetchSuggestions,
    fetchPeakHourForecast,
    markSuggestionImplemented
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSalesData(),
        fetchSuggestions(),
        fetchPeakHourForecast()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchSalesData, fetchSuggestions, fetchPeakHourForecast]);

  // Calculate summary metrics
  const calculateMetrics = () => {
    if (!salesData.length) {
      return {
        totalSales: 0,
        averageOrder: 0,
        customerCount: 0,
        topSellingItem: 'N/A'
      };
    }

    const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
    const customerCount = salesData.length;
    const averageOrder = totalSales / customerCount;

    // Get top selling item
    const itemCounts = {};
    salesData.forEach(sale => {
      if (sale.item_name) {
        itemCounts[sale.item_name] = (itemCounts[sale.item_name] || 0) + 1;
      }
    });

    let topSellingItem = 'N/A';
    let maxCount = 0;
    Object.entries(itemCounts).forEach(([item, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSellingItem = item;
      }
    });

    return {
      totalSales,
      averageOrder,
      customerCount,
      topSellingItem
    };
  };

  const metrics = calculateMetrics();

  // Get high priority suggestions
  const highPrioritySuggestions = suggestions
    .filter(suggestion => suggestion.priority === 'high' && !suggestion.implemented)
    .slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your coffee shop's performance and AI-powered insights
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <DashboardCard
              title="Total Sales"
              value={`$${metrics.totalSales.toFixed(2)}`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              trend="up"
              trendValue="8% from last week"
              color="blue"
            />
            <DashboardCard
              title="Average Order"
              value={`$${metrics.averageOrder.toFixed(2)}`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              trend="up"
              trendValue="2% from last week"
              color="green"
            />
            <DashboardCard
              title="Customer Count"
              value={metrics.customerCount.toString()}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              trend="up"
              trendValue="5% from last week"
              color="purple"
            />
            <DashboardCard
              title="Top Selling Item"
              value={metrics.topSellingItem}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
              color="yellow"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Sales Overview">
              <SalesChart data={salesData} />
            </ChartCard>
            <ChartCard title="Peak Hour Forecast">
              <PeakHourChart data={peakHourForecast} />
            </ChartCard>
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Top Suggestions</h2>
            {highPrioritySuggestions.length > 0 ? (
              highPrioritySuggestions.map(suggestion => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onImplement={markSuggestionImplemented}
                />
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">No high priority suggestions at the moment.</p>
              </div>
            )}
            <div className="mt-4 text-right">
              <a href="/reports" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all suggestions →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
