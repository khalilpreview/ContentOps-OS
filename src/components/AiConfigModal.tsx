import React from 'react';
import { SettingsModal, SettingsModalProps } from './SettingsModal';

export interface AiConfigModalProps extends SettingsModalProps {}

export const AiConfigModal: React.FC<AiConfigModalProps> = (props) => {
  return <SettingsModal {...props} />;
};

export { SettingsModal };
