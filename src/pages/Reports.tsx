import { useState, useEffect } from 'react';
import { maintenanceReports, getBikeSummary, getStationSummary, getMaintenanceSummary, bikes } from '@/data/mockData';
import { MaintenanceReport } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Filter, BarChart2, Check, Clock, AlertTriangle, Bike, MapPin } from 'lucide-react';

const Reports = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<string>('last7days');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>(maintenanceReports);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;
  const bikeSummary = getBikeSummary();
  const stationSummary = getStationSummary();
  const maintenanceSummary = getMaintenanceSummary();

  // Applied filters for display
  const appliedFilters = [];
  if (dateRange !== 'all') appliedFilters.push('Date Range');
  if (statusFilter !== 'all') appliedFilters.push('Status');
  if (priorityFilter !== 'all') appliedFilters.push('Priority');

  const handleExportCSV = () => {
    toast({
      title: 'Report Exported',
      description: 'CSV file has been downloaded successfully',
      variant: 'default',
    });
  };

  const handleApplyFilters = () => {
    let filtered = [...maintenanceReports];
    
    // Apply date filter
    if (dateRange === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(report => new Date(report.reportedAt) >= sevenDaysAgo);
    } else if (dateRange === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(report => new Date(report.reportedAt) >= thirtyDaysAgo);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }
    
    setFilteredReports(filtered);
  };

  useEffect(() => {
    const fetchMaintenanceReports = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/bike/maintenance?page=${page}&limit=${PAGE_SIZE}`);
        if (response.status === 404) {
          // No maintenance endpoint or no data, treat as empty but not error
          setFilteredReports([]);
          setTotalPages(1);
        } else if (!response.ok) {
          throw new Error('Failed to fetch maintenance reports');
        } else {
          const data = await response.json();
          setFilteredReports(data.data || []);
          setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
        }
      } catch (err) {
        // Only show toast if it's a real error, not just empty data
        if (!(err instanceof Error && err.message.includes('404'))) {
          toast({
            title: 'Error',
            description: 'Could not fetch maintenance reports.',
            variant: 'destructive',
          });
        }
        setFilteredReports([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenanceReports();
    // eslint-disable-next-line
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-graydark">Reports</h1>
        <p className="text-muted-foreground">Generate and analyze GreenWheels system reports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Bike Fleet</p>
              <p className="text-2xl font-semibold text-graydark mt-1">{bikeSummary.totalBikes}</p>
            </div>
            <div className="p-2 rounded-md bg-greenprimary/10">
              <Bike size={24} className="text-greenprimary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Available</span>
              <span className="font-medium text-graydark">{bikeSummary.availableBikes}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">In Use</span>
              <span className="font-medium text-graydark">{bikeSummary.inUseBikes}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">In Maintenance</span>
              <span className="font-medium text-graydark">{bikeSummary.maintenanceBikes}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Stations</p>
              <p className="text-2xl font-semibold text-graydark mt-1">{stationSummary.totalStations}</p>
            </div>
            <div className="p-2 rounded-md bg-greenprimary/10">
              <MapPin size={24} className="text-greenprimary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Capacity</span>
              <span className="font-medium text-graydark">{stationSummary.totalCapacity}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Available Bikes</span>
              <span className="font-medium text-graydark">{stationSummary.totalAvailableBikes}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Utilization</span>
              <span className="font-medium text-graydark">{stationSummary.utilization}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-semibold text-graydark mt-1">{maintenanceSummary.totalIssues}</p>
            </div>
            <div className="p-2 rounded-md bg-error/10">
              <AlertTriangle size={24} className="text-error" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending</span>
              <span className="font-medium text-graydark">{maintenanceSummary.pendingIssues}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">In Progress</span>
              <span className="font-medium text-graydark">{maintenanceSummary.inProgressIssues}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Resolved</span>
              <span className="font-medium text-graydark">{maintenanceSummary.resolvedIssues}</span>
            </div>
          </div>
        </div>

        {/* Usage Chart Placeholder */}
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Usage Trends</p>
            </div>
            <div className="p-2 rounded-md bg-greenaccent/20">
              <BarChart2 size={24} className="text-greenaccent" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-40">
            <div className="w-full h-24 flex items-end space-x-1">
              <div className="bg-greenprimary h-[40%] w-full rounded-t"></div>
              <div className="bg-greenprimary h-[60%] w-full rounded-t"></div>
              <div className="bg-greenprimary h-[80%] w-full rounded-t"></div>
              <div className="bg-greenprimary h-[70%] w-full rounded-t"></div>
              <div className="bg-greenprimary h-[90%] w-full rounded-t"></div>
              <div className="bg-greenprimary h-[50%] w-full rounded-t"></div>
              <div className="bg-greenprimary h-[75%] w-full rounded-t"></div>
            </div>
            <div className="w-full flex justify-between mt-2 text-xs text-gray-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow animate-fade-in">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-graydark flex items-center">
              <FileText size={20} className="mr-2" />
              Maintenance Reports
              {appliedFilters.length > 0 && (
                <span className="ml-2 text-xs bg-graylight text-graydark px-2 py-1 rounded-full">
                  {appliedFilters.length} filters applied
                </span>
              )}
            </h2>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center"
            >
              <Download size={16} className="mr-1" />
              Export to CSV
            </Button>
          </div>
        </div>

        <div className="p-4 border-b bg-graylight/40">
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="dateRange" className="block text-xs font-medium text-graydark mb-1">
                Date Range
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-graydark"
              >
                <option value="all">All Time</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-xs font-medium text-graydark mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-graydark"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label htmlFor="priorityFilter" className="block text-xs font-medium text-graydark mb-1">
                Priority
              </label>
              <select
                id="priorityFilter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-graydark"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={handleApplyFilters}
                className="bg-greenprimary hover:bg-greenprimary/80 text-white"
              >
                <Filter size={14} className="mr-1" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading maintenance reports...</div>
          ) : filteredReports.length === 0 ? null : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                    Bike
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  // Map backend fields to expected fields
                  const id = report.id || report.maintenance_id || '';
                  const bikeId = report.bikeId || report.bike_number || '';
                  const issue = report.issue || report.reason || '';
                  const reportedAt = report.reportedAt || report.created_at || '';
                  const priority = report.priority || 'unknown';
                  const status = report.status || report.maintenance_status || 'unknown';
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                        {id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-graydark">
                        {bikeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                        {issue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                        {reportedAt ? new Date(reportedAt).toLocaleDateString() : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${priority === 'high' ? 'bg-error/20 text-error' : 
                            priority === 'medium' ? 'bg-greenaccent/30 text-graydark' : 
                            'bg-gray-100 text-gray-500'}`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {status === 'pending' ? (
                            <Clock size={14} className="text-gray-500 mr-1" />
                          ) : status === 'in-progress' || status === 'in_progress' ? (
                            <AlertTriangle size={14} className="text-greenaccent mr-1" />
                          ) : status === 'resolved' ? (
                            <Check size={14} className="text-greenprimary mr-1" />
                          ) : null}
                          <span className={
                            status === 'pending' ? 'text-gray-500' : 
                            status === 'in-progress' || status === 'in_progress' ? 'text-graydark' : 
                            status === 'resolved' ? 'text-greenprimary' : 'text-gray-400'
                          }>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-between items-center p-4 border-t">
          {filteredReports.length > 0 && (
            <>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
