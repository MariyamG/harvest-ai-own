import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase service for interacting with the database
 */
class SupabaseService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user profile
   */
  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get sales data for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Sales data
   */
  async getSales(userId, options = {}) {
    const { startDate, endDate, limit = 100 } = options;
    
    let query = supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  /**
   * Add a new sale
   * @param {Object} sale - Sale data
   * @returns {Promise<Object>} Created sale
   */
  async addSale(sale) {
    const { data, error } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get inventory items for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Inventory items
   */
  async getInventory(userId, options = {}) {
    const { category, limit = 100 } = options;
    
    let query = supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .order('item_name')
      .limit(limit);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  /**
   * Update an inventory item
   * @param {string} itemId - Item ID
   * @param {Object} updates - Item updates
   * @returns {Promise<Object>} Updated item
   */
  async updateInventoryItem(itemId, updates) {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Add a new inventory item
   * @param {Object} item - Inventory item data
   * @returns {Promise<Object>} Created item
   */
  async addInventoryItem(item) {
    const { data, error } = await supabase
      .from('inventory')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get staff members for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Staff members
   */
  async getStaff(userId) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  /**
   * Update a staff member
   * @param {string} staffId - Staff ID
   * @param {Object} updates - Staff updates
   * @returns {Promise<Object>} Updated staff member
   */
  async updateStaffMember(staffId, updates) {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Add a new staff member
   * @param {Object} staff - Staff member data
   * @returns {Promise<Object>} Created staff member
   */
  async addStaffMember(staff) {
    const { data, error } = await supabase
      .from('staff')
      .insert(staff)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get shifts for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Shifts
   */
  async getShifts(userId, options = {}) {
    const { startDate, endDate, staffId } = options;
    
    let query = supabase
      .from('shifts')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          role
        )
      `)
      .order('start_time');
    
    if (staffId) {
      query = query.eq('staff_id', staffId);
    } else {
      // If no specific staff ID, filter by user ID through staff table
      query = query.in('staff_id', function(subQuery) {
        return subQuery
          .from('staff')
          .select('id')
          .eq('user_id', userId);
      });
    }
    
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  /**
   * Add a new shift
   * @param {Object} shift - Shift data
   * @returns {Promise<Object>} Created shift
   */
  async addShift(shift) {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shift)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update a shift
   * @param {string} shiftId - Shift ID
   * @param {Object} updates - Shift updates
   * @returns {Promise<Object>} Updated shift
   */
  async updateShift(shiftId, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Delete a shift
   * @param {string} shiftId - Shift ID
   * @returns {Promise<void>}
   */
  async deleteShift(shiftId) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    
    if (error) throw error;
  }

  /**
   * Get suggestions for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Suggestions
   */
  async getSuggestions(userId, options = {}) {
    const { implemented, category, priority, limit = 100 } = options;
    
    let query = supabase
      .from('suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (implemented !== undefined) {
      query = query.eq('implemented', implemented);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  /**
   * Mark a suggestion as implemented
   * @param {string} suggestionId - Suggestion ID
   * @returns {Promise<Object>} Updated suggestion
   */
  async markSuggestionImplemented(suggestionId) {
    const { data, error } = await supabase
      .from('suggestions')
      .update({ implemented: true })
      .eq('id', suggestionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get forecasts for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Forecasts
   */
  async getForecasts(userId, options = {}) {
    const { startDate, endDate, dayOfWeek } = options;
    
    let query = supabase
      .from('forecasts')
      .select('*')
      .eq('user_id', userId)
      .order('forecast_date')
      .order('forecast_hour');
    
    if (startDate) {
      query = query.gte('forecast_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('forecast_date', endDate);
    }
    
    if (dayOfWeek !== undefined) {
      query = query.eq('day_of_week', dayOfWeek);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  /**
   * Set up real-time subscription for suggestions
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for new suggestions
   * @returns {Object} Subscription object
   */
  subscribeSuggestions(userId, callback) {
    return supabase
      .channel('suggestions-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'suggestions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  }

  /**
   * Set up real-time subscription for inventory updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for inventory updates
   * @returns {Object} Subscription object
   */
  subscribeInventory(userId, callback) {
    return supabase
      .channel('inventory-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new, payload.eventType)
      )
      .subscribe();
  }
}

export default new SupabaseService();
