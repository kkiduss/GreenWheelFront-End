import { createContext } from 'react';

interface NotificationContextType {
  verificationCount: number;
  setVerificationCount: (count: number) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  verificationCount: 0,
  setVerificationCount: () => {},
}); 