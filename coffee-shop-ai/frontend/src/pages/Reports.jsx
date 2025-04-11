import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import SuggestionCard from '../components/SuggestionCard';

const Reports = () => {
  const { 
    loading, 
    suggestions,
    fetchSuggestions,
    markSuggestionImplemented
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImplemented, setFilterImplemented] = useState('pending');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchSuggestions();
      setIsLoading(false);
    };

    loadData();
  }, [fetchSuggestions]);

  // Mock suggestions data if none exists
  const mockSuggestions = [
    {
      id: 1,
      category: 'inventory',
      suggestion: 'Restock coffee beans soon, current stock is below 20% of par level',
      priority: 'high',
      implemented: false,
      created_at: '2025-04-10T14:30:00Z'
    },
    {
      id: 2,
      category: 'staffing',
      suggestion: 'Consider adding staff during 8-10 AM, customer wait times increased by 30%',
      priority: 'high',
      implemented: false,
      created_at: '2025-04-10T14:30:00Z'
    },
    {
      id: 3,
      category: 'inventory',
      suggestion: 'Promote muffins tomorrow, 10 will expire in 2 days',
      priority: 'medium',
      implemented: true,
      created_at: '2025-04-09T14:30:00Z'
    },
    {
      id: 4,
      category: 'sales',
      suggestion: 'Consider running a promotion during 2-4 PM, sales are consistently low during this period',
      priority: 'medium',
      implemented: false,
      created_at: '2025-04-09T14:30:00Z'
    },
    {
      id: 5,
      category: 'staffing',
      suggestion: 'Reduce staff by 1 during 3-5 PM tomorrow, consistently overstaffed',
      priority: 'low',
      implemented: false,
      created_at: '2025-04-08T14:30:00Z'
    }
  ];

  // Use mock data if no real data is available
  const displayData = suggestions.length > 0 ? suggestions : mockSuggestions;

  // Filter suggestions
  const filteredSuggestions = displayData.filter(suggestion => {
    const matchesPriority = filterPriority === 'all' || suggestion.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || suggestion.category === filterCategory;
    const matchesImplemented = 
      filterImplemented === 'all' || 
      (filterImplemented === 'pending' && !suggestion.implemented) ||
      (filterImplemented === 'implemented' && suggestion.implemented);
    
    return matchesPriority && matchesCategory && matchesImplemented;
  });

  // Get unique categories
  const categories = ['all', ...new Set(displayData.map(item => item.category))];

  // Handle implementing a suggestion
  const handleImplementSuggestion = (id) => {
    markSuggestionImplemented(id);
  };

  // Group suggestions by date
  const groupSuggestionsByDate = (suggestions) => {
    const grouped = {};
    
    suggestions.forEach(suggestion => {
      const date = new Date(suggestion.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(suggestion);
    });
    
    return grouped;
  };

  const groupedSuggestions = groupSuggestionsByDate(filteredSuggestions);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Suggestions</h1>
        <p className="mt-1 text-sm text-gray-500">
          View AI-generated suggestions and insights for your coffee shop
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <label htmlFor="priority-filter" className="mr-2 text-sm font-medium text-gray-700">
                  Priority:
                </label>
                <select
                  id="priority-filter"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-center">
                <label htmlFor="category-filter" className="mr-2 text-sm font-medium text-gray-700">
                  Category:
                </label>
                <select
                  id="category-filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label htmlFor="implemented-filter" className="mr-2 text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  id="implemented-filter"
                  value={filterImplemented}
                  onChange={(e) => setFilterImplemented(e.target.value)}
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="implemented">Implemented</option>
                </select>
              </div>
            </div>
          </div>

          {/* Suggestions list */}
          <div className="mb-6">
            {Object.keys(groupedSuggestions).length > 0 ? (
              Object.entries(groupedSuggestions).map(([date, suggestions]) => (
                <div key={date} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{date}</h2>
                  {suggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onImplement={handleImplementSuggestion}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">No suggestions found matching your criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
