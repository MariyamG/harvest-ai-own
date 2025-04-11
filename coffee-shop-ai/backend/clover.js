const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Clover API configuration
const CLOVER_API_KEY = process.env.CLOVER_API_KEY || 'YOUR_CLOVER_API_KEY';
const CLOVER_BASE_URL = 'https://api.clover.com';
const CLOVER_SANDBOX_URL = 'https://sandbox.dev.clover.com';
const CLOVER_AUTH_URL = 'https://sandbox.dev.clover.com/oauth/authorize';
const CLOVER_TOKEN_URL = 'https://sandbox.dev.clover.com/oauth/token';

// Use sandbox for development
const BASE_URL = CLOVER_SANDBOX_URL;

/**
 * Clover API service for interacting with the Clover POS system
 */
class CloverService {
  constructor() {
    this.clientId = process.env.CLOVER_CLIENT_ID || 'YOUR_CLIENT_ID';
    this.clientSecret = process.env.CLOVER_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
    this.redirectUri = process.env.CLOVER_REDIRECT_URI || 'http://localhost:3000/api/clover/callback';
    this.apiKey = CLOVER_API_KEY;
  }

  /**
   * Get the OAuth authorization URL
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    return `${CLOVER_AUTH_URL}?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code, merchantId) {
    try {
      const response = await axios.post(CLOVER_TOKEN_URL, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          merchant_id: merchantId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error.message);
      throw error;
    }
  }

  /**
   * Get merchant information
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Merchant information
   */
  async getMerchantInfo(merchantId, accessToken) {
    try {
      const response = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting merchant info:', error.message);
      throw error;
    }
  }

  /**
   * Get sales data for a merchant
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Sales data
   */
  async getSales(merchantId, accessToken, options = {}) {
    try {
      const { startDate, endDate, limit = 100 } = options;
      
      // Format date parameters
      const params = { limit };
      if (startDate) {
        params.createdTime = `>${startDate}`;
      }
      if (endDate) {
        params.createdTime = params.createdTime ? `${params.createdTime},<${endDate}` : `<${endDate}`;
      }
      
      // Get orders
      const response = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}/orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params
      });

      // Process orders to extract sales data
      const sales = [];
      for (const order of response.data.elements) {
        // Get line items for this order
        const lineItemsResponse = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}/orders/${order.id}/line_items`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        // Add each line item as a sale
        for (const lineItem of lineItemsResponse.data.elements) {
          sales.push({
            order_id: order.id,
            timestamp: order.createdTime,
            item_name: lineItem.name,
            item_id: lineItem.item ? lineItem.item.id : null,
            quantity: lineItem.quantity,
            price: lineItem.price,
            amount: lineItem.price * lineItem.quantity,
            category: lineItem.item && lineItem.item.categories ? lineItem.item.categories[0] : null
          });
        }
      }

      return sales;
    } catch (error) {
      console.error('Error getting sales data:', error.message);
      throw error;
    }
  }

  /**
   * Get inventory data for a merchant
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Array>} Inventory data
   */
  async getInventory(merchantId, accessToken) {
    try {
      // Get items
      const itemsResponse = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}/items`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Process items to extract inventory data
      const inventory = [];
      for (const item of itemsResponse.data.elements) {
        // Get inventory for this item
        const inventoryResponse = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}/items/${item.id}/inventory`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        // Add inventory data
        inventory.push({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: inventoryResponse.data ? inventoryResponse.data.quantity : 0,
          par_level: item.modifiers && item.modifiers.length > 0 ? item.modifiers[0].quantity : 10, // Default par level
          unit_cost: item.cost || 0,
          category: item.categories && item.categories.length > 0 ? item.categories[0].name : null
        });
      }

      return inventory;
    } catch (error) {
      console.error('Error getting inventory data:', error.message);
      throw error;
    }
  }

  /**
   * Get employee data for a merchant
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Array>} Employee data
   */
  async getEmployees(merchantId, accessToken) {
    try {
      const response = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}/employees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Process employees
      const employees = [];
      for (const employee of response.data.elements) {
        employees.push({
          id: employee.id,
          name: `${employee.name.first} ${employee.name.last}`,
          role: employee.role.name,
          email: employee.email,
          phone: employee.phone
        });
      }

      return employees;
    } catch (error) {
      console.error('Error getting employee data:', error.message);
      throw error;
    }
  }

  /**
   * Get employee shifts for a merchant
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Shift data
   */
  async getShifts(merchantId, accessToken, options = {}) {
    try {
      const { startDate, endDate, employeeId } = options;
      
      // Format date parameters
      const params = {};
      if (startDate) {
        params.filter = `in > '${startDate}'`;
      }
      if (endDate) {
        params.filter = params.filter ? `${params.filter} and out < '${endDate}'` : `out < '${endDate}'`;
      }
      if (employeeId) {
        params.filter = params.filter ? `${params.filter} and employee.id = '${employeeId}'` : `employee.id = '${employeeId}'`;
      }
      
      const response = await axios.get(`${BASE_URL}/v3/merchants/${merchantId}/shifts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params
      });

      // Process shifts
      const shifts = [];
      for (const shift of response.data.elements) {
        // Convert timestamps to Date objects
        const inTime = new Date(shift.in);
        const outTime = shift.out ? new Date(shift.out) : null;
        
        shifts.push({
          id: shift.id,
          employee_id: shift.employee.id,
          employee_name: shift.employee.name,
          start_time: inTime.toISOString(),
          end_time: outTime ? outTime.toISOString() : null,
          hours: outTime ? (outTime - inTime) / (1000 * 60 * 60) : null
        });
      }

      return shifts;
    } catch (error) {
      console.error('Error getting shift data:', error.message);
      throw error;
    }
  }

  /**
   * Sync data from Clover to the application database
   * @param {string} userId - User ID
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Sync results
   */
  async syncData(userId, merchantId, accessToken) {
    try {
      // Get data from Clover
      const sales = await this.getSales(merchantId, accessToken, { 
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      });
      
      const inventory = await this.getInventory(merchantId, accessToken);
      const employees = await this.getEmployees(merchantId, accessToken);
      const shifts = await this.getShifts(merchantId, accessToken, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      });

      // TODO: Save data to database
      // This would typically involve calls to a database service

      return {
        status: 'success',
        synced: {
          sales: sales.length,
          inventory: inventory.length,
          employees: employees.length,
          shifts: shifts.length
        }
      };
    } catch (error) {
      console.error('Error syncing data:', error.message);
      throw error;
    }
  }

  /**
   * Update inventory in Clover
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {string} itemId - Item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Update result
   */
  async updateInventory(merchantId, accessToken, itemId, quantity) {
    try {
      const response = await axios.post(`${BASE_URL}/v3/merchants/${merchantId}/items/${itemId}/inventory`, {
        quantity
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating inventory:', error.message);
      throw error;
    }
  }

  /**
   * Create a new item in Clover
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Created item
   */
  async createItem(merchantId, accessToken, item) {
    try {
      const response = await axios.post(`${BASE_URL}/v3/merchants/${merchantId}/items`, item, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating item:', error.message);
      throw error;
    }
  }

  /**
   * Get sales summary by hour
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Hourly sales summary
   */
  async getHourlySales(merchantId, accessToken, date) {
    try {
      // Get sales for the specified date
      const startDate = `${date}T00:00:00Z`;
      const endDate = `${date}T23:59:59Z`;
      
      const sales = await this.getSales(merchantId, accessToken, { startDate, endDate });
      
      // Group sales by hour
      const hourlySales = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlySales[hour] = {
          hour,
          total: 0,
          count: 0
        };
      }
      
      for (const sale of sales) {
        const saleDate = new Date(sale.timestamp);
        const hour = saleDate.getHours();
        
        hourlySales[hour].total += sale.amount;
        hourlySales[hour].count += 1;
      }
      
      // Convert to array
      return Object.values(hourlySales);
    } catch (error) {
      console.error('Error getting hourly sales:', error.message);
      throw error;
    }
  }

  /**
   * Get sales summary by day of week
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Daily sales summary
   */
  async getDailySales(merchantId, accessToken, options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // Get sales for the specified date range
      const sales = await this.getSales(merchantId, accessToken, { startDate, endDate });
      
      // Group sales by day of week
      const dailySales = {};
      for (let day = 0; day < 7; day++) {
        dailySales[day] = {
          day,
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
          total: 0,
          count: 0
        };
      }
      
      for (const sale of sales) {
        const saleDate = new Date(sale.timestamp);
        const day = saleDate.getDay();
        
        dailySales[day].total += sale.amount;
        dailySales[day].count += 1;
      }
      
      // Convert to array
      return Object.values(dailySales);
    } catch (error) {
      console.error('Error getting daily sales:', error.message);
      throw error;
    }
  }

  /**
   * Get top selling items
   * @param {string} merchantId - Merchant ID
   * @param {string} accessToken - Access token
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Top selling items
   */
  async getTopSellingItems(merchantId, accessToken, options = {}) {
    try {
      const { startDate, endDate, limit = 10 } = options;
      
      // Get sales for the specified date range
      const sales = await this.getSales(merchantId, accessToken, { startDate, endDate });
      
      // Group sales by item
      const itemSales = {};
      
      for (const sale of sales) {
        const itemId = sale.item_id;
        if (!itemId) continue;
        
        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            item_id: itemId,
            item_name: sale.item_name,
            quantity: 0,
            total: 0
          };
        }
        
        itemSales[itemId].quantity += sale.quantity;
        itemSales[itemId].total += sale.amount;
      }
      
      // Convert to array and sort by quantity
      const topItems = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
      
      return topItems;
    } catch (error) {
      console.error('Error getting top selling items:', error.message);
      throw error;
    }
  }
}

module.exports = new CloverService();
