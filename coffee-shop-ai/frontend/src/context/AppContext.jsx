import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create context
export const AppContext = React.createContext();

export const AppProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // App data
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [peakHourForecast, setPeakHourForecast] = useState([]);
  
  // Initialize auth
  React.useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
      
      // Set up auth listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );
      
      return () => subscription.unsubscribe();
    };
    
    checkUser();
  }, []);
  
  // Authentication functions
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Data fetching functions
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      setSalesData(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name');
      
      if (error) throw error;
      setInventoryData(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setStaffData(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching staff data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSuggestions(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPeakHourForecast = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .order('forecast_date', { ascending: true })
        .order('forecast_hour', { ascending: true });
      
      if (error) throw error;
      setPeakHourForecast(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching peak hour forecast:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Data mutation functions
  const updateInventoryItem = async (id, updates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setInventoryData(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const addInventoryItem = async (newItem) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .insert(newItem)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setInventoryData(prev => [...prev, data[0]]);
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const updateStaffMember = async (id, updates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setStaffData(prev => 
        prev.map(staff => staff.id === id ? { ...staff, ...updates } : staff)
      );
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const addStaffMember = async (newStaff) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .insert(newStaff)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setStaffData(prev => [...prev, data[0]]);
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const markSuggestionImplemented = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suggestions')
        .update({ implemented: true })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setSuggestions(prev => 
        prev.map(suggestion => suggestion.id === id ? { ...suggestion, implemented: true } : suggestion)
      );
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const value = {
    // Auth
    user,
    loading,
    signIn,
    signUp,
    signOut,
    
    // Data
    salesData,
    inventoryData,
    staffData,
    suggestions,
    peakHourForecast,
    
    // Data fetching
    fetchSalesData,
    fetchInventoryData,
    fetchStaffData,
    fetchSuggestions,
    fetchPeakHourForecast,
    
    // Data mutation
    updateInventoryItem,
    addInventoryItem,
    updateStaffMember,
    addStaffMember,
    markSuggestionImplemented,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
