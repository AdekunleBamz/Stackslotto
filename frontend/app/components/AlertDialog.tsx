import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}) => {
  const variantColors = {
    danger: 'bg-red-50 text-red-900 border-red-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className={`p-4 rounded border mb-4 ${variantColors[variant]}`}>
        {message}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
