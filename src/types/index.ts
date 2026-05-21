// Centralized type definitions for the entire application
// Import all types from this file to maintain consistency

// OCR Types
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedText {
  text: string;
  boundingBox: BoundingBox;
}

export interface OCRResult {
  text: string;
  boundingBox?: BoundingBox;
}

// File Types
export interface SavedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  type: 'txt' | 'doc' | 'pdf';
  isFavorite?: boolean;
}

export interface DownloadedPDF {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  format: 'pdf' | 'doc' | 'txt';
}

// Navigation Types
export type ScreenType = 'HOME' | 'CAMERA' | 'RESULTS' | 'FILE_VIEWER' | 'PDF_VIEWER' | 'ALL_FILES' | 'PDFS' | 'WELCOME' | 'PERMISSION_DENIED' | 'LOADING';

// Filter Types
export type FilterType = 'name' | 'date' | 'size';

// Component Props Types
export interface FileViewerProps {
  file: SavedFile;
  content: string;
  onBack: () => void;
  onShare: () => void;
}

export interface PDFViewerProps {
  filePath: string;
  fileName: string;
  onBack: () => void;
  onShare?: () => void;
}

export interface ResultsScreenProps {
  detectedTexts: DetectedText[];
  onBack: () => void;
  onCopyText?: () => void;
  onClear?: () => void;
  onGoHome?: () => void;
  onDownloadSuccess?: () => void;
}

export default {};
