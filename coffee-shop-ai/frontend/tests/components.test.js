import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../src/context/AppContext';
import Dashboard from '../src/pages/Dashboard';
import Scheduling from '../src/pages/Scheduling';
import Inventory from '../src/pages/Inventory';
import Reports from '../src/pages/Reports';
import Settings from '../src/pages/Settings';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      session: null
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        data: [],
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}));

// Mock the Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}));

// Helper function to render components with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  test('renders dashboard components', async () => {
    renderWithProviders(<Dashboard />);
    
    // Check for dashboard title
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Check for key metrics section
    expect(screen.getByText(/today's sales/i)).toBeInTheDocument();
    
    // Check for charts
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});

describe('Scheduling Page', () => {
  test('renders scheduling components', async () => {
    renderWithProviders(<Scheduling />);
    
    // Check for scheduling title
    expect(screen.getByText(/staff scheduling/i)).toBeInTheDocument();
    
    // Check for schedule view
    expect(screen.getByText(/schedule/i)).toBeInTheDocument();
    
    // Check for staff list
    expect(screen.getByText(/staff members/i)).toBeInTheDocument();
  });
  
  test('allows adding new staff member', async () => {
    renderWithProviders(<Scheduling />);
    
    // Find and click the add staff button
    const addButton = screen.getByText(/add staff/i);
    fireEvent.click(addButton);
    
    // Check if modal appears
    await waitFor(() => {
      expect(screen.getByText(/add new staff member/i)).toBeInTheDocument();
    });
  });
});

describe('Inventory Page', () => {
  test('renders inventory components', async () => {
    renderWithProviders(<Inventory />);
    
    // Check for inventory title
    expect(screen.getByText(/inventory management/i)).toBeInTheDocument();
    
    // Check for inventory list
    expect(screen.getByText(/inventory items/i)).toBeInTheDocument();
  });
  
  test('allows filtering inventory by category', async () => {
    renderWithProviders(<Inventory />);
    
    // Find and click the category filter
    const filterSelect = screen.getByLabelText(/category/i);
    fireEvent.change(filterSelect, { target: { value: 'beverage' } });
    
    // Check if filter is applied
    await waitFor(() => {
      expect(filterSelect.value).toBe('beverage');
    });
  });
});

describe('Reports Page', () => {
  test('renders reports components', async () => {
    renderWithProviders(<Reports />);
    
    // Check for reports title
    expect(screen.getByText(/reports & suggestions/i)).toBeInTheDocument();
    
    // Check for suggestions section
    expect(screen.getByText(/ai-generated suggestions/i)).toBeInTheDocument();
    
    // Check for sales report section
    expect(screen.getByText(/sales report/i)).toBeInTheDocument();
  });
  
  test('allows generating new suggestions', async () => {
    renderWithProviders(<Reports />);
    
    // Find and click the generate suggestions button
    const generateButton = screen.getByText(/generate new suggestions/i);
    fireEvent.click(generateButton);
    
    // Check if loading indicator appears
    await waitFor(() => {
      expect(screen.getByText(/generating suggestions/i)).toBeInTheDocument();
    });
  });
});

describe('Settings Page', () => {
  test('renders settings components', async () => {
    renderWithProviders(<Settings />);
    
    // Check for settings title
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    
    // Check for profile section
    expect(screen.getByText(/profile settings/i)).toBeInTheDocument();
    
    // Check for Clover integration section
    expect(screen.getByText(/clover integration/i)).toBeInTheDocument();
  });
  
  test('allows updating shop hours', async () => {
    renderWithProviders(<Settings />);
    
    // Find and change the opening time
    const openingTimeInput = screen.getByLabelText(/opening time/i);
    fireEvent.change(openingTimeInput, { target: { value: '07:00' } });
    
    // Find and click the save button
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    // Check if success message appears
    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
    });
  });
});
