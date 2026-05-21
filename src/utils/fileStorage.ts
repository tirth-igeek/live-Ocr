import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

// Helper to check if file is a valid PDF by reading its header
const isValidPDF = async (filePath: string): Promise<boolean> => {
  try {
    const header = await RNFS.read(filePath, 4, 0, 'base64');
    // PDF files start with %PDF (0x25504446 in hex)
    return header === 'JERF'; // base64 encoded %PDF
  } catch {
    return false;
  }
};

const FILES_KEY = '@saved_files';
const FAVORITES_KEY = '@favorite_files';
const DOWNLOADED_PDFS_KEY = '@downloaded_pdfs';
const LAST_VIEWED_PDFS_KEY = '@last_viewed_pdfs';

export interface DownloadedPDF {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  format: 'pdf' | 'doc' | 'txt';
}

export interface SavedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  type: 'txt' | 'doc' | 'pdf';
  isFavorite?: boolean;
}

export const saveFileMetadata = async (file: SavedFile): Promise<void> => {
  try {
    const existingFiles = await getSavedFiles();
    const updatedFiles = [file, ...existingFiles];
    await AsyncStorage.setItem(FILES_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('Error saving file metadata:', error);
  }
};

export const getSavedFiles = async (): Promise<SavedFile[]> => {
  try {
    const filesJson = await AsyncStorage.getItem(FILES_KEY);
    return filesJson ? JSON.parse(filesJson) : [];
  } catch (error) {
    console.error('Error getting saved files:', error);
    return [];
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    const files = await getSavedFiles();
    const fileToDelete = files.find(f => f.id === fileId);

    if (fileToDelete) {
      // Delete actual file
      try {
        await RNFS.unlink(fileToDelete.path);
      } catch (e) {
        console.log('File already deleted or not found');
      }

      // Remove from storage
      const updatedFiles = files.filter(f => f.id !== fileId);
      await AsyncStorage.setItem(FILES_KEY, JSON.stringify(updatedFiles));
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Favorites Functions
export const getFavorites = async (): Promise<string[]> => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const toggleFavorite = async (fileId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    const isFavorite = favorites.includes(fileId);

    let updatedFavorites: string[];
    if (isFavorite) {
      updatedFavorites = favorites.filter(id => id !== fileId);
    } else {
      updatedFavorites = [...favorites, fileId];
    }

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    return !isFavorite;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

export const isFavorite = async (fileId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.includes(fileId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

export const updateFilesList = async (files: SavedFile[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FILES_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error updating files list:', error);
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatFileDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

// Request storage permission for Android
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    if (Platform.Version >= 30) {
      // Android 11+ (API 30+) - Need MANAGE_EXTERNAL_STORAGE for public Downloads
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
        {
          title: 'All Files Access Permission',
          message: 'App needs access to all files to save to the Downloads folder. Please enable "Allow access to manage all files" in settings.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // Android 10 and below (API 29-)
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to save files to Downloads folder',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
};

export const downloadFile = async (
  sourcePath: string,
  fileName: string,
  format: 'doc' | 'pdf' | 'txt',
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    // Request permission first
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot save file without storage permission');
      onError?.(new Error('Permission denied'));
      return;
    }

    // Check if file with same name already exists in public Downloads
    const publicDownloadDir = '/storage/emulated/0/Download';
    const extension = format === 'pdf' ? 'pdf' : format === 'doc' ? 'doc' : 'txt';
    const targetPath = `${publicDownloadDir}/${fileName}.${extension}`;

    const fileExists = await RNFS.exists(targetPath);
    if (fileExists) {
      Alert.alert(
        'File Already Exists',
        `A file named "${fileName}.${extension}" already exists in Downloads. Please use a different name.`,
        [{ text: 'OK', style: 'default' }]
      );
      onError?.(new Error('File already exists'));
      return;
    }

    // Read original content
    const content = await RNFS.readFile(sourcePath, 'utf8');

    let downloadPath: string;
    let fileSize: number;
    let actualFormat = format;

    if (format === 'pdf') {
      // Generate real PDF using react-native-html-to-pdf
      // Plain text only - no styling, no title
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: monospace; 
                padding: 20px; 
                margin: 0;
              }
              pre { 
                white-space: pre-wrap; 
                word-wrap: break-word; 
                font-size: 10pt;
                margin: 0;
                padding: 0;
              }
            </style>
          </head>
          <body>
            <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </body>
        </html>
      `;

      console.log('Generating PDF with fileName:', fileName);

      try {
        // Use react-native-html-to-pdf with base64 output
        // This avoids creating an intermediate file in app-private folder
        const options = {
          html: htmlContent,
          fileName: fileName,
          directory: 'Documents',
          base64: true,
          height: 842, // A4 height in points
          width: 595,  // A4 width in points
        };

        console.log('Generating PDF with base64 output...');

        const pdfResult = await RNHTMLtoPDF.convert(options);

        if (!pdfResult || !pdfResult.base64) {
          throw new Error('PDF generation failed - no base64 data returned');
        }

        console.log('PDF generated in memory, writing directly to public Downloads...');

        // Write directly to public Downloads folder
        const publicDownloadDir = '/storage/emulated/0/Download';
        const publicPath = `${publicDownloadDir}/${fileName}.pdf`;

        // Ensure public download directory exists
        const dirExists = await RNFS.exists(publicDownloadDir);
        if (!dirExists) {
          throw new Error('Public Download directory does not exist');
        }

        // Write base64 PDF data directly to public Downloads
        await RNFS.writeFile(publicPath, pdfResult.base64, 'base64');

        downloadPath = publicPath;
        console.log('PDF saved directly to public Downloads:', publicPath);

        // Get file size
        const stats = await RNFS.stat(publicPath);
        fileSize = stats.size;
        console.log('PDF size:', fileSize, 'bytes');

        // Verify it's actually a valid PDF
        if (fileSize < 1024) {
          throw new Error(`Generated PDF is too small (${fileSize} bytes), likely invalid`);
        }

        // Verify PDF header
        const header = await RNFS.read(publicPath, 8, 0, 'ascii');
        console.log('PDF header:', header);

        if (!header.startsWith('%PDF')) {
          throw new Error(`Generated file is not a valid PDF. Header: ${header}`);
        }

      } catch (pdfError: any) {
        console.error('PDF generation error:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError.message || 'Unknown error'}`);
      }
    } else {
      // Generate Word-compatible HTML document (.doc extension)
      const downloadDir = '/storage/emulated/0/Download';
      downloadPath = `${downloadDir}/${fileName}.doc`;

      const escapedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<title>${fileName}</title>
<style>
body { font-family: "Courier New", monospace; font-size: 12pt; }
pre { white-space: pre-wrap; word-wrap: break-word; }
</style>
</head>
<body>
<pre>${escapedContent}</pre>
</body>
</html>`;

      await ReactNativeBlobUtil.fs.createFile(downloadPath, docContent, 'utf8');

      const fileStats = await ReactNativeBlobUtil.fs.stat(downloadPath);
      fileSize = fileStats.size;
    }

    // Determine actual file extension from the saved path
    const fileExtension = downloadPath.split('.').pop() || actualFormat;

    // Save metadata
    const downloadedPDF: DownloadedPDF = {
      id: Date.now().toString(),
      name: fileName,
      path: downloadPath,
      size: fileSize,
      createdAt: Date.now(),
      format: actualFormat as 'pdf' | 'doc' | 'txt',
    };
    await saveDownloadedPDF(downloadedPDF);

    Alert.alert('Downloaded', `File saved to Downloads folder:\n${fileName}.${fileExtension}`);
    onSuccess?.();
  } catch (error: any) {
    Alert.alert('Error', `Failed to download: ${error?.message || 'Unknown error'}`);
    console.error('Download error:', error);
    onError?.(error);
  }
};

export const shareFile = async (filePath: string, fileName: string): Promise<void> => {
  try {
    if (!filePath) {
      Alert.alert('Error', 'File path is empty');
      return;
    }

    // Check if file exists
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      Alert.alert('Error', 'File not found');
      return;
    }

    // Determine MIME type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    switch (extension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'doc':
      case 'docx':
        mimeType = 'application/msword';
        break;
      case 'txt':
        mimeType = 'text/plain';
        break;
      case 'html':
      case 'htm':
        mimeType = 'text/html';
        break;
      default:
        mimeType = 'application/octet-stream';
    }

    // Copy file to cache directory with proper name for sharing
    const cacheDir = RNFS.CachesDirectoryPath;
    const sharePath = `${cacheDir}/${fileName}`;
    await RNFS.copyFile(filePath, sharePath);

    // Share as file attachment with correct MIME type
    await Share.open({
      url: `file://${sharePath}`,
      type: mimeType,
      filename: fileName,
      failOnCancel: false,
    });

    // Cleanup cache file after share
    setTimeout(() => {
      RNFS.unlink(sharePath).catch(() => { });
    }, 5000);
  } catch (error: any) {
    // User cancelled or error
    if (error.message?.includes('User did not share') || error.message?.includes('cancelled')) {
      return;
    }
    console.error('Share error:', error);
    Alert.alert('Share Error', error?.message || 'Failed to share file');
  }
};

export const deleteFilePermanently = async (
  file: SavedFile,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    // Delete actual file from filesystem
    try {
      await RNFS.unlink(file.path);
    } catch (e) {
      console.log('File already deleted or not found');
    }

    // Remove from AsyncStorage
    const files = await getSavedFiles();
    const updatedFiles = files.filter(f => f.id !== file.id);
    await AsyncStorage.setItem(FILES_KEY, JSON.stringify(updatedFiles));

    onSuccess?.();
  } catch (error: any) {
    console.error('Delete error:', error);
    onError?.(error);
  }
};

// Downloaded PDFs management
export const saveDownloadedPDF = async (pdf: DownloadedPDF): Promise<void> => {
  try {
    const existingPDFs = await getDownloadedPDFs();
    const updatedPDFs = [pdf, ...existingPDFs];
    await AsyncStorage.setItem(DOWNLOADED_PDFS_KEY, JSON.stringify(updatedPDFs));
  } catch (error) {
    console.error('Error saving downloaded PDF:', error);
    throw error;
  }
};

export const getDownloadedPDFs = async (): Promise<DownloadedPDF[]> => {
  try {
    const pdfsJson = await AsyncStorage.getItem(DOWNLOADED_PDFS_KEY);
    return pdfsJson ? JSON.parse(pdfsJson) : [];
  } catch (error) {
    console.error('Error getting downloaded PDFs:', error);
    return [];
  }
};

export const deleteDownloadedPDF = async (pdfId: string): Promise<void> => {
  try {
    const pdfs = await getDownloadedPDFs();
    const pdfToDelete = pdfs.find(p => p.id === pdfId);

    // Delete actual file from Downloads folder
    if (pdfToDelete) {
      try {
        await ReactNativeBlobUtil.fs.unlink(pdfToDelete.path);
      } catch (e) {
        console.log('PDF file already deleted or not found');
      }
    }

    // Remove from AsyncStorage
    const updatedPDFs = pdfs.filter(p => p.id !== pdfId);
    await AsyncStorage.setItem(DOWNLOADED_PDFS_KEY, JSON.stringify(updatedPDFs));
  } catch (error) {
    console.error('Error deleting downloaded PDF:', error);
    throw error;
  }
};

// Track when user last viewed PDFs list
export const markPDFsAsViewed = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_VIEWED_PDFS_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error marking PDFs as viewed:', error);
  }
};

export const getLastViewedPDFsTime = async (): Promise<number> => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_VIEWED_PDFS_KEY);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch (error) {
    console.error('Error getting last viewed time:', error);
    return 0;
  }
};

// Count unread PDFs (downloaded after last view)
export const getUnreadPDFCount = async (): Promise<number> => {
  try {
    const pdfs = await getDownloadedPDFs();
    const lastViewed = await getLastViewedPDFsTime();

    if (lastViewed === 0) {
      // First time - all PDFs are "new"
      return pdfs.length;
    }

    // Count PDFs created after last viewed time
    return pdfs.filter(pdf => pdf.createdAt > lastViewed).length;
  } catch (error) {
    console.error('Error counting unread PDFs:', error);
    return 0;
  }
};
