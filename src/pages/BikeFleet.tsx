import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Bike as BikeTypeBase } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bike, Filter, ArrowLeft } from 'lucide-react';
import BikeStatusBadge from '@/components/ui/bike-status-badge';

// Extend BikeType to allow station_name for backend compatibility
interface BikeTypeWithStationName extends BikeTypeBase {
  station_name?: string;
}

const BikeFleet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bikeList, setBikeList] = useState<BikeTypeWithStationName[]>([]);
  const [filteredBikes, setFilteredBikes] = useState<BikeTypeWithStationName[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const bikesPerPage = 10;

  // Calculate current bikes for pagination
  const indexOfLastBike = currentPage * bikesPerPage;
  const indexOfFirstBike = indexOfLastBike - bikesPerPage;

  // Fetch bikes from API
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/all_bikes');
        if (!response.ok) {
          throw new Error('Failed to fetch bikes');
        }
        let data = await response.json();
        let bikes: BikeTypeWithStationName[] = [];
        if (Array.isArray(data)) {
          bikes = data;
        } else if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data.bikes)) bikes = data.bikes;
          else if (Array.isArray(data.data)) bikes = data.data;
          else if (Array.isArray(data.results)) bikes = data.results;
        }
        setBikeList(bikes);
        setFilteredBikes(bikes);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch bikes data',
          variant: 'destructive',
        });
        setBikeList([]);
        setFilteredBikes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBikes();
  }, [toast]);
  
  // Apply filters
  useEffect(() => {
    let results = Array.isArray(bikeList) ? bikeList : [];

    // Always normalize status for filtering
    if (statusFilter !== 'all') {
      results = results.filter(bike => normalizeStatus(bike.status) === statusFilter);
    }

    // Apply search term filter
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      results = results.filter(
        bike =>
          bike.bike_number.toLowerCase().includes(lowercasedFilter) ||
          bike.model.toLowerCase().includes(lowercasedFilter)
      );
    }

    setFilteredBikes(Array.isArray(results) ? results : []);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, bikeList]);

  // Pagination
  const totalPages = Math.ceil(filteredBikes.length / bikesPerPage);
  
  // Utility to normalize status values to canonical set
  const normalizeStatus = (status: string): 'available' | 'in-use' | 'maintenance' => {
    if (!status) return 'maintenance'; // fallback to maintenance for missing/invalid
    const s = status.trim().toLowerCase().replace('_', '-');
    if (s === 'available') return 'available';
    if (s === 'in-use' || s === 'in use') return 'in-use';
    if (s === 'maintenance' || s === 'maintenance required') return 'maintenance';
    return 'maintenance'; // fallback for unknown
  };

  const handlePageChange = (pageNumber: number) => {
    // Clamp page number to valid range
    if (pageNumber < 1) {
      setCurrentPage(1);
    } else if (pageNumber > totalPages) {
      setCurrentPage(totalPages);
    } else {
      setCurrentPage(pageNumber);
    }
  };

  // Ensure currentPage is always valid when filteredBikes changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages === 0 ? 1 : totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin-dashboard')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-graydark">Bike Fleet Management</h1>
            <p className="text-muted-foreground">Complete overview of all bikes in the system</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bikes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bikeList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-greenprimary">
              {Array.isArray(bikeList) ? bikeList.filter(bike => normalizeStatus(bike.status) === 'available').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {bikeList.length > 0 ? Math.round((bikeList.filter(bike => normalizeStatus(bike.status) === 'available').length / bikeList.length) * 100) : 0}% of fleet
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-greenaccent">
              {Array.isArray(bikeList) ? bikeList.filter(bike => normalizeStatus(bike.status) === 'in-use').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {bikeList.length > 0 ? Math.round((bikeList.filter(bike => normalizeStatus(bike.status) === 'in-use').length / bikeList.length) * 100) : 0}% of fleet
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">
              {Array.isArray(bikeList) ? bikeList.filter(bike => normalizeStatus(bike.status) === 'maintenance').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {bikeList.length > 0 ? Math.round((bikeList.filter(bike => normalizeStatus(bike.status) === 'maintenance').length / bikeList.length) * 100) : 0}% of fleet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Search bikes by ID or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Bike size={16} className="text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-grow px-3 py-2 rounded-md border border-input bg-background text-graydark"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in-use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Bikes Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Bike Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Station
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredBikes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No bikes found
                  </td>
                </tr>
              ) : (
                filteredBikes.slice(indexOfFirstBike, indexOfLastBike).map((bike, idx) => (
                  <tr key={bike.id ?? `${bike.bike_number}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-graydark">
                      {bike.bike_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                      {bike.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                      {bike.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <BikeStatusBadge status={normalizeStatus(bike.status)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                      {bike.station_id ?? bike.station_name ?? ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 gap-2">
            <div className="text-sm text-graydark">
              Showing {filteredBikes.length === 0 ? 0 : indexOfFirstBike + 1} to {filteredBikes.length === 0 ? 0 : Math.min(indexOfLastBike, filteredBikes.length)} of {filteredBikes.length} bikes
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {(() => {
                  let startPage = 1;
                  let endPage = totalPages;
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      startPage = 1;
                      endPage = 5;
                    } else if (currentPage >= totalPages - 2) {
                      startPage = totalPages - 4;
                      endPage = totalPages;
                    } else {
                      startPage = currentPage - 2;
                      endPage = currentPage + 2;
                    }
                  }
                  const pages: JSX.Element[] = [];
                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(
                      <Button
                        key={`page-btn-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? "bg-greenprimary hover:bg-greenprimary/80" : ""}
                        disabled={page === currentPage}
                      >
                        {page}
                      </Button>
                    );
                  }
                  return pages;
                })()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1">Page {currentPage} of {totalPages}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BikeFleet;