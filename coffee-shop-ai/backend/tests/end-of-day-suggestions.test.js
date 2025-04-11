const supabaseService = require('../supabase');
const cloverService = require('../clover');
const endOfDaySuggestionsService = require('../end-of-day-suggestions');

// Mock the dependencies
jest.mock('../supabase');
jest.mock('../clover');

describe('End-of-Day Suggestions Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementations
    supabaseService.getUsersWithCloverIntegration.mockResolvedValue([
      { id: 'user1' },
      { id: 'user2' }
    ]);
    
    supabaseService.getCloverCredentials.mockResolvedValue({
      merchantId: 'merchant1',
      accessToken: 'token1'
    });
    
    supabaseService.getSales.mockResolvedValue([
      { id: 'sale1', timestamp: new Date().toISOString(), amount: 10.50 },
      { id: 'sale2', timestamp: new Date().toISOString(), amount: 15.75 }
    ]);
    
    supabaseService.getInventory.mockResolvedValue([
      { id: 'item1', item_name: 'Coffee Beans', quantity: 10, par_level: 20 },
      { id: 'item2', item_name: 'Milk', quantity: 5, par_level: 10 }
    ]);
    
    supabaseService.getStaff.mockResolvedValue([
      { id: 'staff1', name: 'John Doe', role: 'Barista' },
      { id: 'staff2', name: 'Jane Smith', role: 'Manager' }
    ]);
    
    supabaseService.getShifts.mockResolvedValue([
      { id: 'shift1', staff_id: 'staff1', start_time: '2025-04-11T08:00:00Z', end_time: '2025-04-11T16:00:00Z' },
      { id: 'shift2', staff_id: 'staff2', start_time: '2025-04-11T10:00:00Z', end_time: '2025-04-11T18:00:00Z' }
    ]);
    
    cloverService.syncData.mockResolvedValue({
      status: 'success',
      synced: {
        sales: 10,
        inventory: 5,
        employees: 3,
        shifts: 8
      }
    });
  });
  
  test('runAnalysisForAllUsers should process all users', async () => {
    // Spy on runAnalysisForUser
    const spy = jest.spyOn(endOfDaySuggestionsService, 'runAnalysisForUser').mockResolvedValue();
    
    await endOfDaySuggestionsService.runAnalysisForAllUsers();
    
    // Should call runAnalysisForUser for each user
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('user1');
    expect(spy).toHaveBeenCalledWith('user2');
    
    // Restore the original implementation
    spy.mockRestore();
  });
  
  test('runAnalysisForUser should sync data and generate suggestions', async () => {
    // Mock the generateSuggestions method
    const generateSpy = jest.spyOn(endOfDaySuggestionsService, 'generateSuggestions').mockResolvedValue([
      { category: 'inventory', suggestion: 'Restock Coffee Beans', priority: 'high' },
      { category: 'staffing', suggestion: 'Add more staff during peak hours', priority: 'medium' }
    ]);
    
    // Mock the saveSuggestions method
    const saveSpy = jest.spyOn(endOfDaySuggestionsService, 'saveSuggestions').mockResolvedValue();
    
    await endOfDaySuggestionsService.runAnalysisForUser('user1');
    
    // Should call syncCloverData
    expect(cloverService.syncData).toHaveBeenCalledWith('user1', 'merchant1', 'token1');
    
    // Should call generateSuggestions
    expect(generateSpy).toHaveBeenCalled();
    
    // Should call saveSuggestions
    expect(saveSpy).toHaveBeenCalled();
    
    // Restore the original implementations
    generateSpy.mockRestore();
    saveSpy.mockRestore();
  });
  
  test('collectDataForAnalysis should gather all required data', async () => {
    const data = await endOfDaySuggestionsService.collectDataForAnalysis('user1');
    
    // Should call getSales twice (for 30-day and today)
    expect(supabaseService.getSales).toHaveBeenCalledTimes(2);
    
    // Should call getInventory
    expect(supabaseService.getInventory).toHaveBeenCalledWith('user1');
    
    // Should call getStaff
    expect(supabaseService.getStaff).toHaveBeenCalledWith('user1');
    
    // Should call getShifts
    expect(supabaseService.getShifts).toHaveBeenCalled();
    
    // Should return object with all data properties
    expect(data).toHaveProperty('sales');
    expect(data).toHaveProperty('todaySales');
    expect(data).toHaveProperty('inventory');
    expect(data).toHaveProperty('staff');
    expect(data).toHaveProperty('shifts');
  });
  
  test('runAnalysisOnDemand should run analysis and return suggestions', async () => {
    // Mock the runAnalysisForUser method
    const analysisSpy = jest.spyOn(endOfDaySuggestionsService, 'runAnalysisForUser').mockResolvedValue();
    
    // Mock getSuggestions to return test suggestions
    supabaseService.getSuggestions.mockResolvedValue([
      { id: 'suggestion1', category: 'inventory', suggestion: 'Restock Coffee Beans', priority: 'high' },
      { id: 'suggestion2', category: 'staffing', suggestion: 'Add more staff during peak hours', priority: 'medium' }
    ]);
    
    const suggestions = await endOfDaySuggestionsService.runAnalysisOnDemand('user1');
    
    // Should call runAnalysisForUser
    expect(analysisSpy).toHaveBeenCalledWith('user1');
    
    // Should call getSuggestions
    expect(supabaseService.getSuggestions).toHaveBeenCalled();
    
    // Should return suggestions
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toHaveProperty('id', 'suggestion1');
    expect(suggestions[1]).toHaveProperty('id', 'suggestion2');
    
    // Restore the original implementation
    analysisSpy.mockRestore();
  });
});
