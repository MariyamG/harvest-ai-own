import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabaseService from './supabase.js';
import cloverService from './clover.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseService.verifyToken(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// User routes
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const profile = await supabaseService.getUserProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const updatedProfile = await supabaseService.updateUserProfile(req.user.id, req.body);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sales routes
app.get('/api/sales', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const sales = await supabaseService.getSales(req.user.id, { startDate, endDate, limit });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', authenticateUser, async (req, res) => {
  try {
    const sale = {
      ...req.body,
      user_id: req.user.id
    };
    const newSale = await supabaseService.addSale(sale);
    res.status(201).json(newSale);
  } catch (error) {
    console.error('Error adding sale:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Inventory routes
app.get('/api/inventory', authenticateUser, async (req, res) => {
  try {
    const { category, limit } = req.query;
    const inventory = await supabaseService.getInventory(req.user.id, { category, limit });
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', authenticateUser, async (req, res) => {
  try {
    const item = {
      ...req.body,
      user_id: req.user.id
    };
    const newItem = await supabaseService.addInventoryItem(item);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding inventory item:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/inventory/:id', authenticateUser, async (req, res) => {
  try {
    const updatedItem = await supabaseService.updateInventoryItem(req.params.id, req.body);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Staff routes
app.get('/api/staff', authenticateUser, async (req, res) => {
  try {
    const staff = await supabaseService.getStaff(req.user.id);
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/staff', authenticateUser, async (req, res) => {
  try {
    const staffMember = {
      ...req.body,
      user_id: req.user.id
    };
    const newStaffMember = await supabaseService.addStaffMember(staffMember);
    res.status(201).json(newStaffMember);
  } catch (error) {
    console.error('Error adding staff member:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/staff/:id', authenticateUser, async (req, res) => {
  try {
    const updatedStaffMember = await supabaseService.updateStaffMember(req.params.id, req.body);
    res.json(updatedStaffMember);
  } catch (error) {
    console.error('Error updating staff member:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Shifts routes
app.get('/api/shifts', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const shifts = await supabaseService.getShifts(req.user.id, { startDate, endDate, staffId });
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts', authenticateUser, async (req, res) => {
  try {
    const newShift = await supabaseService.addShift(req.body);
    res.status(201).json(newShift);
  } catch (error) {
    console.error('Error adding shift:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shifts/:id', authenticateUser, async (req, res) => {
  try {
    const updatedShift = await supabaseService.updateShift(req.params.id, req.body);
    res.json(updatedShift);
  } catch (error) {
    console.error('Error updating shift:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shifts/:id', authenticateUser, async (req, res) => {
  try {
    await supabaseService.deleteShift(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting shift:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Suggestions routes
app.get('/api/suggestions', authenticateUser, async (req, res) => {
  try {
    const { implemented, category, priority, limit } = req.query;
    const suggestions = await supabaseService.getSuggestions(req.user.id, { 
      implemented: implemented === 'true', 
      category, 
      priority, 
      limit 
    });
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suggestions/:id/implement', authenticateUser, async (req, res) => {
  try {
    const updatedSuggestion = await supabaseService.markSuggestionImplemented(req.params.id);
    res.json(updatedSuggestion);
  } catch (error) {
    console.error('Error implementing suggestion:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Forecasts routes
app.get('/api/forecasts', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, dayOfWeek } = req.query;
    const forecasts = await supabaseService.getForecasts(req.user.id, { 
      startDate, 
      endDate, 
      dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : undefined 
    });
    res.json(forecasts);
  } catch (error) {
    console.error('Error fetching forecasts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Clover integration routes
app.get('/api/clover/auth', (req, res) => {
  const authUrl = cloverService.getAuthUrl();
  res.json({ authUrl });
});

app.post('/api/clover/callback', async (req, res) => {
  try {
    const { code, merchant_id } = req.body;
    const tokenData = await cloverService.exchangeCodeForToken(code, merchant_id);
    res.json(tokenData);
  } catch (error) {
    console.error('Error in Clover OAuth callback:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clover/sales', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sales = await cloverService.getSales(req.user.id, { startDate, endDate });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching Clover sales:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clover/inventory', authenticateUser, async (req, res) => {
  try {
    const inventory = await cloverService.getInventory(req.user.id);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching Clover inventory:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clover/sync', authenticateUser, async (req, res) => {
  try {
    const result = await cloverService.syncData(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error syncing Clover data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
