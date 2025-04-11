import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const Settings = () => {
  const { user, signOut } = useApp();
  
  const [shopSettings, setShopSettings] = useState({
    shopName: 'My Coffee Shop',
    location: 'Vancouver',
    openingTime: '06:00',
    closingTime: '22:00',
    cloverApiKey: '',
    weatherApiKey: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    dailySummary: true,
    lowStockAlerts: true,
    staffingAlerts: true
  });
  
  const [integrationSettings, setIntegrationSettings] = useState({
    cloverIntegration: false,
    weatherIntegration: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleShopSettingsChange = (e) => {
    const { name, value } = e.target;
    setShopSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleIntegrationChange = (e) => {
    const { name, checked } = e.target;
    setIntegrationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your coffee shop settings and integrations
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shop Information</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                Shop Name
              </label>
              <input
                type="text"
                name="shopName"
                id="shopName"
                value={shopSettings.shopName}
                onChange={handleShopSettingsChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={shopSettings.location}
                onChange={handleShopSettingsChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700">
                Opening Time
              </label>
              <input
                type="time"
                name="openingTime"
                id="openingTime"
                value={shopSettings.openingTime}
                onChange={handleShopSettingsChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700">
                Closing Time
              </label>
              <input
                type="time"
                name="closingTime"
                id="closingTime"
                value={shopSettings.closingTime}
                onChange={handleShopSettingsChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="cloverIntegration"
                  name="cloverIntegration"
                  type="checkbox"
                  checked={integrationSettings.cloverIntegration}
                  onChange={handleIntegrationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="cloverIntegration" className="font-medium text-gray-700">
                  Clover POS Integration
                </label>
                <p className="text-gray-500">Connect to your Clover Mini POS system for real-time sales data.</p>
              </div>
            </div>
            
            {integrationSettings.cloverIntegration && (
              <div className="ml-7">
                <label htmlFor="cloverApiKey" className="block text-sm font-medium text-gray-700">
                  Clover API Key
                </label>
                <input
                  type="password"
                  name="cloverApiKey"
                  id="cloverApiKey"
                  value={shopSettings.cloverApiKey}
                  onChange={handleShopSettingsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your Clover API key"
                />
              </div>
            )}
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="weatherIntegration"
                  name="weatherIntegration"
                  type="checkbox"
                  checked={integrationSettings.weatherIntegration}
                  onChange={handleIntegrationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="weatherIntegration" className="font-medium text-gray-700">
                  Weather API Integration
                </label>
                <p className="text-gray-500">Include weather data in your sales predictions.</p>
              </div>
            </div>
            
            {integrationSettings.weatherIntegration && (
              <div className="ml-7">
                <label htmlFor="weatherApiKey" className="block text-sm font-medium text-gray-700">
                  Weather API Key
                </label>
                <input
                  type="password"
                  name="weatherApiKey"
                  id="weatherApiKey"
                  value={shopSettings.weatherApiKey}
                  onChange={handleShopSettingsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your Weather API key"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="emailNotifications"
                  name="emailNotifications"
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-gray-500">Receive notifications via email.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="dailySummary"
                  name="dailySummary"
                  type="checkbox"
                  checked={notificationSettings.dailySummary}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="dailySummary" className="font-medium text-gray-700">
                  Daily Summary
                </label>
                <p className="text-gray-500">Receive a daily summary of your shop's performance.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="lowStockAlerts"
                  name="lowStockAlerts"
                  type="checkbox"
                  checked={notificationSettings.lowStockAlerts}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="lowStockAlerts" className="font-medium text-gray-700">
                  Low Stock Alerts
                </label>
                <p className="text-gray-500">Get notified when inventory items are running low.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="staffingAlerts"
                  name="staffingAlerts"
                  type="checkbox"
                  checked={notificationSettings.staffingAlerts}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="staffingAlerts" className="font-medium text-gray-700">
                  Staffing Alerts
                </label>
                <p className="text-gray-500">Get notified about recommended staffing changes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
        
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign Out
        </button>
      </div>
      
      {saveSuccess && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          Settings saved successfully!
        </div>
      )}
    </div>
  );
};

export default Settings;
