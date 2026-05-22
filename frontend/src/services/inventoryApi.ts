// frontend/src/services/inventoryApi.ts
import axios from 'axios';
import type { InventoryItem, InventoryQueryParams } from '../types/inventory';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const inventoryApi = {
  queryInventory: async (params: InventoryQueryParams): Promise<{ content: InventoryItem[], totalPages: number, totalElements: number }> => {
    const response = await axios.get(`${API_URL}/inventory`, { params });
    return response.data;
  },

  getBookStock: async (bookId: number): Promise<InventoryItem> => {
    const response = await axios.get(`${API_URL}/inventory/${bookId}`);
    return response.data;
  }
};

export default inventoryApi;
