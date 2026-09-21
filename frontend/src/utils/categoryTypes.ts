import { CategoryTypeConfig, DEFAULT_CATEGORY_TYPES } from '../types';
import { api } from '../services/api';

const STORAGE_KEY = 'lifeos_category_types';

export const getStoredCategoryTypes = (): CategoryTypeConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: CategoryTypeConfig[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored category types:', err);
  }
  return DEFAULT_CATEGORY_TYPES;
};

export const fetchCategoryTypes = async (): Promise<CategoryTypeConfig[]> => {
  try {
    const allSettings = await api.settings.getAll();
    if (allSettings?.custom_category_types) {
      const parsed: CategoryTypeConfig[] = JSON.parse(allSettings.custom_category_types);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch custom_category_types from backend:', err);
  }
  return getStoredCategoryTypes();
};

export const saveCategoryTypes = async (types: CategoryTypeConfig[]): Promise<void> => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  try {
    await api.settings.set('custom_category_types', JSON.stringify(types));
  } catch (err) {
    console.error('Failed to persist custom_category_types to backend:', err);
  }
  window.dispatchEvent(new CustomEvent('lifeos_category_types_updated', { detail: types }));
};

export const getCategoryTypeConfig = (
  typeId: string,
  typesList: CategoryTypeConfig[] = getStoredCategoryTypes()
): CategoryTypeConfig => {
  const found = typesList.find((t) => t.id === typeId);
  if (found) return found;

  // Fallback for legacy or unknown types
  if (typeId === 'DISTRACTION') {
    return {
      id: 'DISTRACTION',
      label: 'Xao nhãng',
      color: '#f59e0b',
      effect: 'PENALTY',
    };
  }
  if (typeId === 'PRODUCTIVE') {
    return {
      id: 'PRODUCTIVE',
      label: 'Tập trung',
      color: '#10b981',
      effect: 'BONUS',
    };
  }
  return {
    id: typeId || 'OTHER',
    label: typeId ? typeId.charAt(0) + typeId.slice(1).toLowerCase() : 'Khác',
    color: '#64748b',
    effect: 'NEUTRAL',
  };
};
