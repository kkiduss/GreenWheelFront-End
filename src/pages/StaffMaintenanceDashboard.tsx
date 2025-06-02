import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Clock, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { maintenanceReports, bikes, mockUsers, commonIssues } from '@/data/mockData';
import { MaintenanceReport, CommonIssue, Bike } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { CustomPagination } from '@/components/ui/custom-pagination';

const StaffMaintenanceDashboard = ({ reportSource = 'staff' }: { reportSource?: 'user' | 'staff' }) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBike, setSelectedBike] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [issue_description, setIssue_description] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Initialize reports based on source
  useEffect(() => {
    let initialReports = maintenanceReports;
    setReports(initialReports);
    setFilteredReports(initialReports);
  }, [reportSource]);
  
  // Filter reports
  useEffect(() => {
    let results = [...reports];
    if (statusFilter !== 'all') {
      results = results.filter(report => report.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      results = results.filter(report => report.priority === priorityFilter);
    }
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      results = results.filter(report =>
        report.bikeId.toLowerCase().includes(lowercasedSearchTerm) ||
        report.issue.toLowerCase().includes(lowercasedSearchTerm)
      );
    }
    setFilteredReports(results);
    setCurrentPage(1);
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  
  const handleUpdateStatus = (id: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    toast({
      title: 'Status Updated',
      description: `Report ${id} has been marked as ${newStatus}`
    });
  };

  const handleNewReport = () => {
    setShowForm(true);
  };

  const handleSubmitReport = () => {
    if (!selectedBike || !selectedIssue || !issue_description) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    // Create new report logic
    toast({
      title: 'Success',
      description: 'Report submitted successfully.',
    });
    
    setShowForm(false);
    setSelectedBike('');
    setSelectedIssue('');
    setIssue_description('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Maintenance Dashboard</h1>
        <Button onClick={handleNewReport}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Total Reports
              </h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {reports.length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Pending Reports
              </h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {reports.filter((report) => report.status === 'pending').length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Resolved Reports
              </h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {reports.filter((report) => report.status === 'resolved').length}
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded p-2"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="border rounded p-2"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentReports.map(report => {
                const reportBike = bikes.find(b => b.id === report.bikeId);
                
                return (
                  <Card key={report.id} className="overflow-hidden">
                    <CardHeader className={`
                      ${report.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20' : 
                        report.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                        'bg-green-50 dark:bg-green-900/20'}
                    `}>
                      <div className="flex justify-between">
                        <CardTitle className="text-base">Report #{report.id}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${report.priority === 'high' ? 'bg-error/20 text-error' : 
                            report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                        >
                          {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-medium">{report.issue}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.issue}</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Bike ID:</span>
                          <span className="font-medium">{report.bikeId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span className="font-medium">{new Date(report.reportedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${report.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                              report.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 
                              'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-2">
                        {report.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center"
                            onClick={() => handleUpdateStatus(report.id, 'in-progress')}
                          >
                            <Clock className="mr-1" size={14} />
                            Start Work
                          </Button>
                        )}
                        {report.status === 'in-progress' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          >
                            <CheckCircle className="mr-1" size={14} />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                No maintenance issues found matching your criteria.
              </div>
            )}
            
            {filteredReports.length > itemsPerPage && (
              <div className="mt-4">
                <CustomPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredReports.length}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md space-y-4 animate-fade-in">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Submit New Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bike" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Bike
              </label>
              <select
                id="bike"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 dark:bg-gray-800"
                value={selectedBike}
                onChange={(e) => setSelectedBike(e.target.value)}
              >
                <option value="">Select a bike</option>
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.model} ({bike.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="issue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Common Issues
              </label>
              <select
                id="issue"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 dark:bg-gray-800"
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
              >
                <option value="">Select an issue</option>
                {commonIssues.map((issue: CommonIssue) => (
                  <option key={issue.id} value={issue.name.toLowerCase()}>
                    {issue.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Input
              id="description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 dark:bg-gray-800"
              value={issue_description}
              onChange={(e) => setIssue_description(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmitReport}>Submit Report</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffMaintenanceDashboard;
