import { Alert } from 'react-native';

export const copyToClipboard = async (text: string): Promise<void> => {
  Alert.alert('Copied!', `Text "${text}" copied to clipboard`);
};
