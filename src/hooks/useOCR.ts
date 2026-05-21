import { useState, useCallback } from 'react';
import { OCRService } from '../services/ocrService';
import type { DetectedText } from '../types';

export const useOCR = () => {
  const [detectedTexts, setDetectedTexts] = useState<DetectedText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (photoPath: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const uri = `file://${photoPath}`;
      const result = await OCRService.detectFromUri(uri);

      if (result && result.length > 0) {
        const newDetectedTexts = OCRService.mapToDetectedText(result);

        setDetectedTexts((prev) => {
          const newTexts = newDetectedTexts.filter(
            (newText) => !prev.some((oldText) => oldText.text === newText.text)
          );
          return [...prev, ...newTexts];
        });
        setIsProcessing(false);
        return true;
      }

      setIsProcessing(false);
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsProcessing(false);
      return false;
    }
  }, []);

  const clearTexts = useCallback(() => {
    setDetectedTexts([]);
    setError(null);
  }, []);

  const removeText = useCallback((index: number) => {
    setDetectedTexts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    detectedTexts,
    isProcessing,
    error,
    processImage,
    clearTexts,
    removeText,
  };
};
