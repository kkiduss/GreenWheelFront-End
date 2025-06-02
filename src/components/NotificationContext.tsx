import React from 'react';

export const NotificationContext = React.createContext<{
  verificationCount: number;
  setVerificationCount: (count: number) => void;
}>({
  verificationCount: 0,
  setVerificationCount: () => {},
});
