import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { SavedFile, DownloadedPDF } from '../../utils/fileStorage';
import {
  getSavedFiles,
  getFavorites,
  getDownloadedPDFs,
  getUnreadPDFCount,
} from '../../utils/fileStorage';

// Async thunks for data fetching
export const fetchHomeData = createAsyncThunk(
  'home/fetchHomeData',
  async (_, { rejectWithValue }) => {
    try {
      const [files, favorites, pdfs, unreadCount] = await Promise.all([
        getSavedFiles(),
        getFavorites(),
        getDownloadedPDFs(),
        getUnreadPDFCount(),
      ]);

      // Add favorite status to files
      const filesWithFavorites = files.map(f => ({
        ...f,
        isFavorite: favorites.includes(f.id),
      }));

      return {
        files: filesWithFavorites,
        favorites,
        pdfCount: pdfs.length,
        unreadPDFCount: unreadCount,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch data');
    }
  }
);

export const refreshFiles = createAsyncThunk(
  'home/refreshFiles',
  async (_, { rejectWithValue }) => {
    try {
      const files = await getSavedFiles();
      const favorites = await getFavorites();

      const filesWithFavorites = files.map(f => ({
        ...f,
        isFavorite: favorites.includes(f.id),
      }));

      return { files: filesWithFavorites, favorites };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to refresh files');
    }
  }
);

export const refreshPDFs = createAsyncThunk(
  'home/refreshPDFs',
  async (_, { rejectWithValue }) => {
    try {
      const [pdfs, unreadCount] = await Promise.all([
        getDownloadedPDFs(),
        getUnreadPDFCount(),
      ]);

      return {
        pdfCount: pdfs.length,
        unreadPDFCount: unreadCount,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to refresh PDFs');
    }
  }
);

interface HomeState {
  // Data
  files: SavedFile[];
  favorites: string[];
  pdfCount: number;
  unreadPDFCount: number;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // UI State
  searchQuery: string;
  searchVisible: boolean;
  sortBy: 'date' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  activeFilter: 'all' | 'pdf' | 'favorites';
}

const initialState: HomeState = {
  files: [],
  favorites: [],
  pdfCount: 0,
  unreadPDFCount: 0,
  isLoading: true,
  isRefreshing: false,
  error: null,
  searchQuery: '',
  searchVisible: false,
  sortBy: 'date',
  sortOrder: 'desc',
  activeFilter: 'all',
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    // UI Actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchVisible: (state, action: PayloadAction<boolean>) => {
      state.searchVisible = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'date' | 'name' | 'size'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    setActiveFilter: (state, action: PayloadAction<'all' | 'pdf' | 'favorites'>) => {
      state.activeFilter = action.payload;
    },

    // Data Actions
    updateFileFavorite: (state, action: PayloadAction<{ fileId: string; isFavorite: boolean }>) => {
      const { fileId, isFavorite } = action.payload;
      const file = state.files.find(f => f.id === fileId);
      if (file) {
        file.isFavorite = isFavorite;
      }
      if (isFavorite) {
        state.favorites.push(fileId);
      } else {
        state.favorites = state.favorites.filter(id => id !== fileId);
      }
    },
    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter(f => f.id !== action.payload);
    },
    addFile: (state, action: PayloadAction<SavedFile>) => {
      state.files.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Home Data
    builder
      .addCase(fetchHomeData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload.files;
        state.favorites = action.payload.favorites;
        state.pdfCount = action.payload.pdfCount;
        state.unreadPDFCount = action.payload.unreadPDFCount;
      })
      .addCase(fetchHomeData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh Files
    builder
      .addCase(refreshFiles.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(refreshFiles.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.files = action.payload.files;
        state.favorites = action.payload.favorites;
      })
      .addCase(refreshFiles.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload as string;
      });

    // Refresh PDFs
    builder
      .addCase(refreshPDFs.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(refreshPDFs.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.pdfCount = action.payload.pdfCount;
        state.unreadPDFCount = action.payload.unreadPDFCount;
      })
      .addCase(refreshPDFs.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectFiles = (state: { home: HomeState }) => state.home.files;
export const selectFavorites = (state: { home: HomeState }) => state.home.favorites;
export const selectFileCount = (state: { home: HomeState }) => state.home.files.length;
export const selectPDFCount = (state: { home: HomeState }) => state.home.pdfCount;
export const selectUnreadPDFCount = (state: { home: HomeState }) => state.home.unreadPDFCount;
export const selectIsLoading = (state: { home: HomeState }) => state.home.isLoading;
export const selectIsRefreshing = (state: { home: HomeState }) => state.home.isRefreshing;
export const selectError = (state: { home: HomeState }) => state.home.error;
export const selectSearchQuery = (state: { home: HomeState }) => state.home.searchQuery;
export const selectSearchVisible = (state: { home: HomeState }) => state.home.searchVisible;
export const selectSortBy = (state: { home: HomeState }) => state.home.sortBy;
export const selectSortOrder = (state: { home: HomeState }) => state.home.sortOrder;
export const selectActiveFilter = (state: { home: HomeState }) => state.home.activeFilter;

// Input selectors for memoized filtered selector
const selectFilesInput = (state: { home: HomeState }) => state.home.files;
const selectSearchQueryInput = (state: { home: HomeState }) => state.home.searchQuery;
const selectSortByInput = (state: { home: HomeState }) => state.home.sortBy;
const selectSortOrderInput = (state: { home: HomeState }) => state.home.sortOrder;
const selectActiveFilterInput = (state: { home: HomeState }) => state.home.activeFilter;
const selectFavoritesInput = (state: { home: HomeState }) => state.home.favorites;

// Memoized filtered and sorted files selector
export const selectFilteredFiles = createSelector(
  [selectFilesInput, selectSearchQueryInput, selectSortByInput, selectSortOrderInput, selectActiveFilterInput, selectFavoritesInput],
  (files, searchQuery, sortBy, sortOrder, activeFilter, favorites) => {
    let filtered = [...files];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (activeFilter === 'favorites') {
      filtered = filtered.filter(file => favorites.includes(file.id));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = b.createdAt - a.createdAt;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }
);

export const {
  setSearchQuery,
  setSearchVisible,
  setSortBy,
  setSortOrder,
  setActiveFilter,
  updateFileFavorite,
  removeFile,
  addFile,
  clearError,
} = homeSlice.actions;

export default homeSlice.reducer;
