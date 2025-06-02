import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  summary: {
    label: string;
    value: string | number;
    type?: 'string' | 'number';
  }[];
  type?: 'success' | 'warning' | 'error' | 'info';
  confirmText?: string;
  cancelText?: string;
}

const SummaryDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  summary,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: SummaryDialogProps): JSX.Element => {
  const formatValue = (value: string | number, valueType?: 'string' | 'number') => {
    if (valueType === 'number') {
      return Number(value).toString();
    }
    return String(value);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-greenprimary" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-error" />;
      default:
        return <AlertCircle className="h-6 w-6 text-greenprimary" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'success':
        return 'bg-greenprimary hover:bg-greenprimary/90';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error':
        return 'bg-error hover:bg-error/90';
      default:
        return 'bg-greenprimary hover:bg-greenprimary/90';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getIcon()}
            <DialogTitle className="text-graydark dark:text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-3">
            {summary.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span className="text-sm font-medium text-graydark dark:text-gray-300">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatValue(item.value, item.type)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="mr-2 border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`text-white ${getButtonVariant()}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryDialog; 