import React from 'react';
import { toast } from 'sonner';
import { 
  IconInfoCircle, 
  IconAlertCircle, 
  IconCircleCheck, 
  IconAlertTriangle
} from '@tabler/icons-react';

// For notifications, we'll use sonner toast
export const showNotification = (props: {
  title?: string;
  message: string;
  color?: 'blue' | 'red' | 'yellow' | 'green';
  icon?: React.ReactNode;
  autoClose?: boolean | number;
  onClose?: () => void;
  id?: string;
  loading?: boolean;
}) => {
  const toastOptions = {
    description: props.message,
    duration: typeof props.autoClose === 'number' ? props.autoClose : props.autoClose === false ? Infinity : 4000,
    onDismiss: props.onClose,
    id: props.id,
  };

  const toastContent = props.title ? (
    <div>
      <div className="font-semibold">{props.title}</div>
      <div className="text-sm opacity-90">{props.message}</div>
    </div>
  ) : (
    props.message
  );

  if (props.loading) {
    return toast.loading(toastContent, toastOptions);
  }

  switch (props.color) {
    case 'red':
      return toast.error(toastContent, { 
        ...toastOptions,
        icon: props.icon || <IconAlertCircle size={20} />,
      });
    case 'green':
      return toast.success(toastContent, { 
        ...toastOptions,
        icon: props.icon || <IconCircleCheck size={20} />,
      });
    case 'yellow':
      return toast.warning(toastContent, { 
        ...toastOptions,
        icon: props.icon || <IconAlertTriangle size={20} />,
      });
    case 'blue':
    default:
      return toast(toastContent, { 
        ...toastOptions,
        icon: props.icon || <IconInfoCircle size={20} />,
      });
  }
};

// Helper to update notifications
export const updateNotification = (props: {
  id: string;
  title?: string;
  message: string;
  color?: 'blue' | 'red' | 'yellow' | 'green';
  icon?: React.ReactNode;
  autoClose?: boolean | number;
  onClose?: () => void;
  loading?: boolean;
}) => {
  toast.dismiss(props.id);
  showNotification(props);
};

// Helper to hide notifications
export const hideNotification = (id?: string) => {
  if (id) {
    toast.dismiss(id);
  } else {
    toast.dismiss();
  }
};

// Create a notifications object with Mantine-like API
export const notifications = {
  show: showNotification,
  update: updateNotification,
  hide: hideNotification,
  clean: () => hideNotification(),
  cleanQueue: () => hideNotification(),
};