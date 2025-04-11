import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import InventoryItem from '../components/InventoryItem';

const Inventory = () => {
  const { 
    loading, 
    inventoryData,
    fetchInventoryData,
    updateInventoryItem,
    addInventoryItem
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 0,
    par_level: 0,
    unit_cost: 0,
    expiry_date: '',
    category: 'beverage'
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchInventoryData();
      setIsLoading(false);
    };

    loadData();
  }, [fetchInventoryData]);

  // Mock inventory data if none exists
  const mockInventoryData = [
    {
      id: 1,
      item_name: 'Coffee Beans',
      quantity: 50,
      par_level: 100,
      unit_cost: 12.00,
      expiry_date: '2025-06-11',
      category: 'beverage'
    },
    {
      id: 2,
      item_name: 'Milk',
      quantity: 20,
      par_level: 40,
      unit_cost: 4.00,
      expiry_date: '2025-04-18',
      category: 'dairy'
    },
    {
      id: 3,
      item_name: 'Sugar',
      quantity: 30,
      par_level: 50,
      unit_cost: 3.00,
      expiry_date: '2026-04-11',
      category: 'dry goods'
    },
    {
      id: 4,
      item_name: 'Cups',
      quantity: 100,
      par_level: 200,
      unit_cost: 0.15,
      expiry_date: null,
      category: 'supplies'
    },
    {
      id: 5,
      item_name: 'Muffins',
      quantity: 15,
      par_level: 30,
      unit_cost: 2.50,
      expiry_date: '2025-04-14',
      category: 'food'
    }
  ];

  // Use mock data if no real data is available
  const displayData = inventoryData.length > 0 ? inventoryData : mockInventoryData;

  // Filter and search inventory
  const filteredInventory = displayData.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['all', ...new Set(displayData.map(item => item.category))];

  const handleEditItem = (id) => {
    const item = displayData.find(item => item.id === id);
    if (item) {
      setEditingItem(item);
      setShowAddModal(true);
    }
  };

  const handleReorderItem = (id) => {
    const item = displayData.find(item => item.id === id);
    if (item) {
      // In a real app, this would trigger a reorder process
      console.log('Reordering item', item);
      alert(`Reordering ${item.item_name}`);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setNewItem({
      item_name: '',
      quantity: 0,
      par_level: 0,
      unit_cost: 0,
      expiry_date: '',
      category: 'beverage'
    });
    setShowAddModal(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      // Update existing item
      updateInventoryItem(editingItem.id, editingItem);
    } else {
      // Add new item
      addInventoryItem(newItem);
    }
    setShowAddModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage your inventory with AI-powered optimization
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
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
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-full sm:w-auto">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleAddItem}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Inventory list */}
          <div className="mb-6">
            {filteredInventory.length > 0 ? (
              filteredInventory.map(item => (
                <InventoryItem
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onReorder={handleReorderItem}
                />
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">No inventory items found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Add/Edit item modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name:
                    </label>
                    <input
                      type="text"
                      id="item-name"
                      value={editingItem ? editingItem.item_name : newItem.item_name}
                      onChange={(e) => editingItem 
                        ? setEditingItem({...editingItem, item_name: e.target.value})
                        : setNewItem({...newItem, item_name: e.target.value})
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity:
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        min="0"
                        value={editingItem ? editingItem.quantity : newItem.quantity}
                        onChange={(e) => editingItem 
                          ? setEditingItem({...editingItem, quantity: parseInt(e.target.value)})
                          : setNewItem({...newItem, quantity: parseInt(e.target.value)})
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="par-level" className="block text-sm font-medium text-gray-700 mb-1">
                        Par Level:
                      </label>
                      <input
                        type="number"
                        id="par-level"
                        min="0"
                        value={editingItem ? editingItem.par_level : newItem.par_level}
                        onChange={(e) => editingItem 
                          ? setEditingItem({...editingItem, par_level: parseInt(e.target.value)})
                          : setNewItem({...newItem, par_level: parseInt(e.target.value)})
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="unit-cost" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Cost ($):
                      </label>
                      <input
                        type="number"
                        id="unit-cost"
                        min="0"
                        step="0.01"
                        value={editingItem ? editingItem.unit_cost : newItem.unit_cost}
                        onChange={(e) => editingItem 
                          ? setEditingItem({...editingItem, unit_cost: parseFloat(e.target.value)})
                          : setNewItem({...newItem, unit_cost: parseFloat(e.target.value)})
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category:
                      </label>
                      <select
                        id="category"
                        value={editingItem ? editingItem.category : newItem.category}
                        onChange={(e) => editingItem 
                          ? setEditingItem({...editingItem, category: e.target.value})
                          : setNewItem({...newItem, category: e.target.value})
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="beverage">Beverage</option>
                        <option value="food">Food</option>
                        <option value="dairy">Dairy</option>
                        <option value="dry goods">Dry Goods</option>
                        <option value="supplies">Supplies</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date:
                    </label>
                    <input
                      type="date"
                      id="expiry-date"
                      value={editingItem ? (editingItem.expiry_date || '') : newItem.expiry_date}
                      onChange={(e) => editingItem 
                        ? setEditingItem({...editingItem, expiry_date: e.target.value})
                        : setNewItem({...newItem, expiry_date: e.target.value})
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Inventory;
