const cron = require('node-cron');
const supabaseService = require('./supabase');
const cloverService = require('./clover');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// AI model API URL
const AI_MODEL_API_URL = process.env.AI_MODEL_API_URL || 'http://localhost:5000';

/**
 * End-of-Day Suggestions Service
 * Analyzes daily operations and generates intelligent suggestions
 */
class EndOfDaySuggestionsService {
  /**
   * Initialize the service
   */
  constructor() {
    // Schedule the end-of-day analysis to run at 11:30 PM every day
    this.scheduledJob = null;
  }

  /**
   * Start the scheduled job
   */
  startScheduledJob() {
    if (this.scheduledJob) {
      this.scheduledJob.stop();
    }

    // Schedule to run at 11:30 PM every day
    this.scheduledJob = cron.schedule('30 23 * * *', async () => {
      console.log('Running end-of-day analysis...');
      await this.runAnalysisForAllUsers();
    });

    console.log('End-of-day analysis scheduled to run at 11:30 PM daily');
  }

  /**
   * Stop the scheduled job
   */
  stopScheduledJob() {
    if (this.scheduledJob) {
      this.scheduledJob.stop();
      this.scheduledJob = null;
      console.log('End-of-day analysis job stopped');
    }
  }

  /**
   * Run analysis for all users
   */
  async runAnalysisForAllUsers() {
    try {
      // Get all users with Clover integration
      const users = await supabaseService.getUsersWithCloverIntegration();

      // Run analysis for each user
      for (const user of users) {
        try {
          await this.runAnalysisForUser(user.id);
        } catch (error) {
          console.error(`Error running analysis for user ${user.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error running analysis for all users:', error.message);
    }
  }

  /**
   * Run analysis for a specific user
   * @param {string} userId - User ID
   */
  async runAnalysisForUser(userId) {
    try {
      console.log(`Running analysis for user ${userId}`);

      // Get user's Clover credentials
      const cloverCredentials = await supabaseService.getCloverCredentials(userId);
      
      if (!cloverCredentials) {
        console.log(`No Clover credentials found for user ${userId}`);
        return;
      }

      // Sync latest data from Clover
      await this.syncCloverData(userId, cloverCredentials);

      // Get data for analysis
      const data = await this.collectDataForAnalysis(userId);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(data);

      // Save suggestions to database
      await this.saveSuggestions(userId, suggestions);

      console.log(`Analysis completed for user ${userId}, ${suggestions.length} suggestions generated`);
    } catch (error) {
      console.error(`Error in runAnalysisForUser for ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync data from Clover
   * @param {string} userId - User ID
   * @param {Object} cloverCredentials - Clover credentials
   */
  async syncCloverData(userId, cloverCredentials) {
    try {
      const { merchantId, accessToken } = cloverCredentials;
      
      // Sync data from Clover to our database
      await cloverService.syncData(userId, merchantId, accessToken);
    } catch (error) {
      console.error(`Error syncing Clover data for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Collect data for analysis
   * @param {string} userId - User ID
   * @returns {Object} Data for analysis
   */
  async collectDataForAnalysis(userId) {
    try {
      // Get sales data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sales = await supabaseService.getSales(userId, {
        startDate: thirtyDaysAgo.toISOString()
      });

      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = await supabaseService.getSales(userId, {
        startDate: today.toISOString()
      });

      // Get inventory data
      const inventory = await supabaseService.getInventory(userId);

      // Get staff data
      const staff = await supabaseService.getStaff(userId);

      // Get shifts for the last 30 days
      const shifts = await supabaseService.getShifts(userId, {
        startDate: thirtyDaysAgo.toISOString()
      });

      // Get peak hour forecast
      const peakHourForecast = await this.getPeakHourForecast(userId);

      return {
        sales,
        todaySales,
        inventory,
        staff,
        shifts,
        peakHourForecast
      };
    } catch (error) {
      console.error(`Error collecting data for analysis for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get peak hour forecast
   * @param {string} userId - User ID
   * @returns {Array} Peak hour forecast
   */
  async getPeakHourForecast(userId) {
    try {
      // Get user's shop hours
      const userProfile = await supabaseService.getUserProfile(userId);
      const shopHours = userProfile.shop_hours || [6, 22]; // Default 6 AM to 10 PM
      
      // Get weather data if available
      const weatherData = await this.getWeatherData(userProfile.location);
      
      // Call AI model API to get peak hour forecast
      const response = await axios.post(`${AI_MODEL_API_URL}/predict/peak_hours`, {
        start_date: new Date().toISOString().split('T')[0],
        days: 7,
        shop_hours: shopHours,
        weather_data: weatherData
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting peak hour forecast:', error.message);
      // Return empty array if forecast fails
      return [];
    }
  }

  /**
   * Get weather data for a location
   * @param {string} location - Location
   * @returns {Object} Weather data
   */
  async getWeatherData(location) {
    if (!location) return null;
    
    try {
      // This would typically call a weather API
      // For now, return mock data
      const today = new Date();
      const weatherData = {};
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Alternate between sunny and rainy
        weatherData[dateStr] = i % 2 === 0 ? 'sunny' : 'rainy';
      }
      
      return weatherData;
    } catch (error) {
      console.error('Error getting weather data:', error.message);
      return null;
    }
  }

  /**
   * Generate suggestions using the AI model
   * @param {Object} data - Data for analysis
   * @returns {Array} Generated suggestions
   */
  async generateSuggestions(data) {
    try {
      // Call AI model API to generate suggestions
      const response = await axios.post(`${AI_MODEL_API_URL}/generate/suggestions`, {
        sales: data.todaySales,
        inventory: data.inventory,
        staff_schedule: data.shifts,
        peak_hour_forecast: data.peakHourForecast
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating suggestions:', error.message);
      throw error;
    }
  }

  /**
   * Save suggestions to database
   * @param {string} userId - User ID
   * @param {Array} suggestions - Generated suggestions
   */
  async saveSuggestions(userId, suggestions) {
    try {
      // Add user_id and created_at to each suggestion
      const suggestionsWithMetadata = suggestions.map(suggestion => ({
        ...suggestion,
        user_id: userId,
        created_at: new Date().toISOString(),
        implemented: false
      }));
      
      // Save to database
      await supabaseService.addSuggestions(userId, suggestionsWithMetadata);
    } catch (error) {
      console.error('Error saving suggestions:', error.message);
      throw error;
    }
  }

  /**
   * Run analysis on demand for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Generated suggestions
   */
  async runAnalysisOnDemand(userId) {
    try {
      await this.runAnalysisForUser(userId);
      
      // Get the latest suggestions
      const suggestions = await supabaseService.getSuggestions(userId, {
        limit: 20,
        implemented: false
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error running analysis on demand:', error.message);
      throw error;
    }
  }
}

module.exports = new EndOfDaySuggestionsService();
