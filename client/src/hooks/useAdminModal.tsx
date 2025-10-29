import { useState } from 'react';

export interface AdminModalState {
  isVisible: boolean;
  showCreateModal: () => void;
  hideModal: () => void;
}

export const useAdminModal = (): AdminModalState => {
  const [isVisible, setVisible] = useState(false);

  const showCreateModal = () => {
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  return {
    isVisible,
    showCreateModal,
    hideModal,
  };
};

