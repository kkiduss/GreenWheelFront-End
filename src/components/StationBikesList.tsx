
import { useState } from 'react';
import { Bike } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface StationBikesListProps {
  stationName: string;
  bikes: Bike[];
  itemsPerPage?: number;
}

const StationBikesList = ({ stationName, bikes, itemsPerPage = 5 }: StationBikesListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastBike = currentPage * itemsPerPage;
  const indexOfFirstBike = indexOfLastBike - itemsPerPage;
  const currentBikes = bikes.slice(indexOfFirstBike, indexOfLastBike);
  const totalPages = Math.ceil(bikes.length / itemsPerPage);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
      <CollapsibleTrigger 
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{stationName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{bikes.length} bikes</p>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {currentBikes.map(bike => (
              <div 
                key={bike.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{bike.model}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{bike.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium
                    ${bike.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
                      bike.status === 'in-use' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 
                      'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}
                  >
                    {bike.status.charAt(0).toUpperCase() + bike.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
            
            {currentBikes.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No bikes to display
              </div>
            )}
          </div>

          {bikes.length > itemsPerPage && (
            <div className="mt-4">
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={bikes.length}
              />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </div>
  );
};

export default StationBikesList;
