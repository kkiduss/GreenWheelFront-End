import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getUserById, bikes } from '@/data/mockData';
import { Reservation } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListCheck, Filter, Search, CheckCircle } from 'lucide-react';
import { CustomPagination } from '@/components/ui/custom-pagination';

const Reservations = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]); // Fetch reservations dynamically
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show 10 reservations per page

  // Fetch reservations from the API
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/bikes/1/reserved', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404) {
            console.warn('No reserved bikes found:', errorText);
            setReservations([]); // Set an empty array if no reservations are found
            setFilteredReservations([]); // Ensure filtered reservations are also empty
            return;
          }
          console.error('Failed to fetch reservations:', response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setReservations(data); // Assume the API returns an array of reservations
        setFilteredReservations(data); // Initialize filtered reservations
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch reservations. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    fetchReservations();
  }, [toast]);

  // Filter reservations based on search and status filter
  useMemo(() => {
    let results = [...reservations];

    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(reservation => reservation.status === statusFilter);
    }

    // Apply search term filter
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      results = results.filter(
        reservation =>
          reservation.id.toLowerCase().includes(lowercasedFilter) ||
          reservation.bikeId.toLowerCase().includes(lowercasedFilter) ||
          reservation.userId.toLowerCase().includes(lowercasedFilter) ||
          (reservation.code && reservation.code.toLowerCase().includes(lowercasedFilter))
      );
    }

    setFilteredReservations(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, reservations]);

  // Pagination
  const indexOfLastReservation = currentPage * itemsPerPage;
  const indexOfFirstReservation = indexOfLastReservation - itemsPerPage;
  const currentReservations = filteredReservations.slice(indexOfFirstReservation, indexOfLastReservation);
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  // Handle status update
  const handleStatusUpdate = (id: string, newStatus: 'active' | 'completed' | 'overdue' | 'cancelled') => {
    toast({
      title: 'Status Updated',
      description: `Reservation ${id} has been marked as ${newStatus}`,
    });
  };

  // Get user name from ID
  const getUserName = (userId: string) => {
    const user = getUserById(userId);
    return user ? user.name : 'Unknown User';
  };

  // Get bike model from ID
  const getBikeModel = (bikeId: string) => {
    const bike = bikes.find(b => b.id === bikeId);
    return bike ? bike.model : 'Unknown Bike';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-graydark">Reservations Management</h1>
          <p className="text-muted-foreground">Manage and track bike reservations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by ID, user, bike or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-graydark" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded p-2 focus:outline-none focus:ring-2"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-graylight">
          <h2 className="text-lg font-semibold flex items-center">
            <ListCheck className="mr-2" size={18} />
            Reservation List
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-graylight">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Reservation ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Bike
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-greenprimary">
                    {reservation.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {reservation.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {getUserName(reservation.userId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {getBikeModel(reservation.bikeId)} ({reservation.bikeId})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {new Date(reservation.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${reservation.status === 'active' ? 'bg-greenprimary/20 text-greenprimary' : 
                        reservation.status === 'completed' ? 'bg-gray-100 text-gray-600' : 
                        reservation.status === 'overdue' ? 'bg-error/20 text-error' :
                        'bg-gray-100 text-gray-500'}`}
                    >
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {reservation.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center"
                        onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                      >
                        <CheckCircle className="mr-1" size={14} />
                        Complete
                      </Button>
                    )}
                    {reservation.status === 'overdue' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center text-error"
                        onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                      >
                        <CheckCircle className="mr-1" size={14} />
                        Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReservations.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No reservations found matching your criteria.
          </div>
        )}
        
        {filteredReservations.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-200">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredReservations.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
