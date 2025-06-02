import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Bike, Loader2, AlertCircle, CheckCircle2, Clock, ChevronDown, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Bike {
  id: number;
  bike_number: string;
  model: string;
  brand: string;
  status: string;
  station_name: string;
  created_at: string;
}

const StationBikes = () => {
  const { toast } = useToast();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchStationBikes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://127.0.0.1:8000/api/stations/2/bikes');
        const data = await response.json();
        
        const bikesData = data.bikes || [];
        setBikes(bikesData);
        
      } catch (err) {
        console.error('Error fetching bikes:', err);
        setError('Failed to load bikes');
      } finally {
        setLoading(false);
      }
    };

    fetchStationBikes();
  }, []);

  const filteredBikes = bikes.filter(bike => {
    const matchesSearch = bike.bike_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bike.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredBikes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBikes.length / ITEMS_PER_PAGE);

  // Statistics
  const availableBikes = bikes.filter(bike => bike.status === 'available').length;
  const inUseBikes = bikes.filter(bike => bike.status === 'in_use').length;
  const maintenanceBikes = bikes.filter(bike => bike.status === 'maintenance').length;

  // Add logging for filtered bikes
  useEffect(() => {
    console.log('Filtered bikes:', filteredBikes);
    console.log('Current items:', currentItems);
  }, [filteredBikes, currentItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading station bikes...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all':
        return 'All Bikes';
      case 'available':
        return 'Available';
      case 'in_use':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-emerald-600';
      case 'in_use':
        return 'text-blue-600';
      case 'maintenance':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_use':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bike className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Station Bike Management
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage your bike station fleet</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              Total: {bikes.length} bikes | Showing: {filteredBikes.length}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-100 shadow-sm bg-white hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Available Bikes</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{availableBikes}</div>
            <p className="text-xs text-gray-500 mt-1">
              Ready for rental
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Bikes in Use</CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{inUseBikes}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently rented
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Under Maintenance</CardTitle>
            <div className="p-2 bg-amber-50 rounded-full">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{maintenanceBikes}</div>
            <p className="text-xs text-gray-500 mt-1">
              Service required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bikes Table */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="bg-white border-b border-gray-100 rounded-t-lg">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">Bike Inventory</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Detailed view of all bikes in your station</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Status Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-white">
                      <Filter className="h-4 w-4" />
                      {getStatusLabel(statusFilter)}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] bg-white">
                    <DropdownMenuItem
                      onClick={() => setStatusFilter('all')}
                      className={`flex items-center gap-2 ${statusFilter === 'all' ? 'bg-gray-100' : ''}`}
                    >
                      <Bike className="h-4 w-4 text-gray-500" />
                      <span>All Bikes</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {bikes.length}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter('available')}
                      className={`flex items-center gap-2 ${statusFilter === 'available' ? 'bg-emerald-50' : ''}`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Available</span>
                      <span className="ml-auto text-xs text-emerald-500">
                        {bikes.filter(b => b.status === 'available').length}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter('in_use')}
                      className={`flex items-center gap-2 ${statusFilter === 'in_use' ? 'bg-blue-50' : ''}`}
                    >
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>In Use</span>
                      <span className="ml-auto text-xs text-blue-500">
                        {bikes.filter(b => b.status === 'in_use').length}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter('maintenance')}
                      className={`flex items-center gap-2 ${statusFilter === 'maintenance' ? 'bg-amber-50' : ''}`}
                    >
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Maintenance</span>
                      <span className="ml-auto text-xs text-amber-500">
                        {bikes.filter(b => b.status === 'maintenance').length}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search Input */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 min-w-[300px]">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by bike number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {statusFilter !== 'all' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {getStatusIcon(statusFilter)}
                  <span>Showing {filteredBikes.length} {statusFilter} bikes</span>
                </div>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-2"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Bike Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created At</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((bike, index) => (
                    <tr 
                      key={bike.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Bike className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="font-semibold text-gray-900">{bike.bike_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{bike.model}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{bike.brand}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          bike.status === 'available' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          bike.status === 'in_use' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {bike.status === 'available' ? <CheckCircle2 className="h-3 w-3" /> :
                           bike.status === 'in_use' ? <Clock className="h-3 w-3" /> :
                           <AlertCircle className="h-3 w-3" />}
                          {bike.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(bike.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center bg-white">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-12 w-12 text-gray-300" />
                        <div className="text-gray-500">
                          <p className="font-medium">No bikes found</p>
                          <p className="text-sm">Try adjusting your filters or search criteria</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t border-gray-100 bg-white">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBikes.length)} of {filteredBikes.length} bikes
                {statusFilter !== 'all' && ` (${statusFilter} only)`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="hover:bg-gray-50"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 ${
                          currentPage === page 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StationBikes;
