import React from 'react';

interface TripReceiptStaffProps {
  trip: {
    id: string;
    tracking_code: string;
    bike_number: string;
    user_name?: string;
    start_time?: string;
    end_time?: string;
    duration?: number;
    price?: number | string;
    status?: string;
    payment_type?: string;
  };
  onClose?: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

const formatDuration = (minutes?: number) => {
  if (minutes === undefined || minutes === null) return 'N/A';
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} seconds`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const formatPrice = (price?: number | string) => {
  if (price === undefined || price === null) return 'N/A';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return 'N/A';
  return `ETB ${numericPrice.toFixed(2)}`;
};

const TripReceiptStaff: React.FC<TripReceiptStaffProps> = ({ trip, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto p-8 dark:bg-gray-800">
      <div className="text-center border-b border-gray-200 pb-4 mb-4 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GreenWheels</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Trip Receipt (Staff)</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">Trip ID:</div>
          <div className="font-medium text-right">{trip.id}</div>
          <div className="text-gray-600 dark:text-gray-400">Tracking Code:</div>
          <div className="font-medium text-right">{trip.tracking_code}</div>
          <div className="text-gray-600 dark:text-gray-400">Bike Number:</div>
          <div className="font-medium text-right">{trip.bike_number}</div>
          <div className="text-gray-600 dark:text-gray-400">User:</div>
          <div className="font-medium text-right">{trip.user_name || 'N/A'}</div>
          <div className="text-gray-600 dark:text-gray-400">Start Time:</div>
          <div className="font-medium text-right">{formatDate(trip.start_time)}</div>
          <div className="text-gray-600 dark:text-gray-400">End Time:</div>
          <div className="font-medium text-right">{formatDate(trip.end_time)}</div>
          <div className="text-gray-600 dark:text-gray-400">Duration:</div>
          <div className="font-medium text-right">{formatDuration(trip.duration)}</div>
          <div className="text-gray-600 dark:text-gray-400">Payment Type:</div>
          <div className="font-medium text-right">{trip.payment_type || 'N/A'}</div>
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
          <span className="text-lg font-bold text-greenprimary">{formatPrice(trip.price)}</span>
        </div>
        <div className="text-center mt-4">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold
            ${trip.status === 'completed' ? 'bg-greenprimary/20 text-greenprimary dark:bg-greenprimary/40 dark:text-white' :
              trip.status === 'in-progress' ? 'bg-blueprimary/20 text-blueprimary dark:bg-blueprimary/40 dark:text-white' :
              'bg-error/20 text-error dark:bg-error/40 dark:text-white'}`}
          >
            {(trip.status || 'UNKNOWN').toUpperCase()}
          </span>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 text-center dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Thank you for using GreenWheels!
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:text-white"
            >
              Close Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripReceiptStaff;
