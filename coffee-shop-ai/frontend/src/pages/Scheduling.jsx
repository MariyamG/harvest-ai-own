import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ChartCard from '../components/ChartCard';
import ScheduleItem from '../components/ScheduleItem';

const Scheduling = () => {
  const { 
    loading, 
    staffData, 
    peakHourForecast,
    fetchStaffData,
    fetchPeakHourForecast,
    updateStaffMember,
    addStaffMember
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShift, setNewShift] = useState({
    staffId: '',
    day: selectedDay,
    start: '09:00',
    end: '17:00',
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchStaffData(),
        fetchPeakHourForecast()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchStaffData, fetchPeakHourForecast]);

  // Mock schedule data - in a real app, this would come from the backend
  useEffect(() => {
    const mockSchedules = [
      {
        id: 1,
        staff: { id: 1, name: 'John Smith', role: 'Barista' },
        shift: { start: '6:00 AM', end: '2:00 PM', notes: 'Morning shift' }
      },
      {
        id: 2,
        staff: { id: 2, name: 'Jane Doe', role: 'Manager' },
        shift: { start: '8:00 AM', end: '4:00 PM', notes: 'Opening duties' }
      },
      {
        id: 3,
        staff: { id: 3, name: 'Mike Johnson', role: 'Barista' },
        shift: { start: '10:00 AM', end: '6:00 PM', notes: '' }
      },
      {
        id: 4,
        staff: { id: 4, name: 'Sarah Williams', role: 'Cashier' },
        shift: { start: '2:00 PM', end: '10:00 PM', notes: 'Closing duties' }
      }
    ];

    setSchedules(mockSchedules);
  }, []);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleEditShift = (staffId, shift) => {
    // In a real app, this would open a modal to edit the shift
    console.log('Edit shift for staff', staffId, shift);
  };

  const handleDeleteShift = (staffId, shift) => {
    // In a real app, this would confirm and then delete the shift
    console.log('Delete shift for staff', staffId, shift);
    setSchedules(schedules.filter(schedule => schedule.id !== staffId));
  };

  const handleAddShift = () => {
    setShowAddModal(true);
  };

  const handleSaveNewShift = () => {
    // In a real app, this would save the new shift to the backend
    const staffMember = staffData.find(staff => staff.id === newShift.staffId);
    if (staffMember) {
      const newSchedule = {
        id: schedules.length + 1,
        staff: { id: staffMember.id, name: staffMember.name, role: staffMember.role },
        shift: { 
          start: newShift.start, 
          end: newShift.end, 
          notes: newShift.notes 
        }
      };
      setSchedules([...schedules, newSchedule]);
    }
    setShowAddModal(false);
    setNewShift({
      staffId: '',
      day: selectedDay,
      start: '09:00',
      end: '17:00',
      notes: ''
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Scheduling</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your staff schedule and optimize based on predicted customer traffic
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Day selector and add button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <label htmlFor="day-select" className="mr-2 text-sm font-medium text-gray-700">
                Day:
              </label>
              <select
                id="day-select"
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {daysOfWeek.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddShift}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Shift
            </button>
          </div>

          {/* Peak hour forecast */}
          <div className="mb-6">
            <ChartCard title={`Peak Hour Forecast for ${daysOfWeek[selectedDay]}`}>
              <PeakHourChart 
                data={peakHourForecast.filter(f => f.day_of_week === selectedDay)} 
              />
            </ChartCard>
          </div>

          {/* Schedule list */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Schedule</h2>
            {schedules.length > 0 ? (
              schedules.map(schedule => (
                <ScheduleItem
                  key={schedule.id}
                  staff={schedule.staff}
                  shift={schedule.shift}
                  onEdit={handleEditShift}
                  onDelete={handleDeleteShift}
                />
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">No shifts scheduled for this day.</p>
              </div>
            )}
          </div>

          {/* Add shift modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Shift</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Staff Member:
                    </label>
                    <select
                      id="staff-select"
                      value={newShift.staffId}
                      onChange={(e) => setNewShift({...newShift, staffId: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a staff member</option>
                      {staffData.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time:
                    </label>
                    <input
                      type="time"
                      id="start-time"
                      value={newShift.start}
                      onChange={(e) => setNewShift({...newShift, start: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
                      End Time:
                    </label>
                    <input
                      type="time"
                      id="end-time"
                      value={newShift.end}
                      onChange={(e) => setNewShift({...newShift, end: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes:
                    </label>
                    <textarea
                      id="notes"
                      value={newShift.notes}
                      onChange={(e) => setNewShift({...newShift, notes: e.target.value})}
                      rows={3}
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
                    onClick={handleSaveNewShift}
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

export default Scheduling;
