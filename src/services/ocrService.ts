import RNCamera from 'react-native-mlkit-ocr';
import type { OCRResult, DetectedText } from '../types';

export class OCRService {
  static async detectFromUri(uri: string): Promise<OCRResult[]> {
    try {
      const result = await RNCamera.detectFromUri(uri);
      return result || [];
    } catch (error) {
      console.error('OCR detection error:', error);
      throw error;
    }
  }

  static mapToDetectedText(result: OCRResult[]): DetectedText[] {
    return result.map((item) => ({
      text: item.text,
      boundingBox: item.boundingBox || {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      },
    }));
  }
}
