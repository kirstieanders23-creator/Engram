import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { 
  configureNotifications, 
  scheduleWarrantyNotifications, 
  cancelProductNotifications, 
  rescheduleProductNotifications 
} from '../utils/notifications';

const DatabaseContext = createContext(null);


export const DatabaseProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    console.log('DatabaseProvider: mounting');
  }, []);

  // Load data and configure notifications on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Configure notification handler
        await configureNotifications();
        const [loadedRooms, loadedProducts] = await Promise.all([
          storage.getRooms(),
          storage.getProducts(),
        ]);
        console.log('DatabaseProvider: loaded rooms', loadedRooms);
        console.log('DatabaseProvider: loaded products', loadedProducts);
        setRooms(loadedRooms);
        setProducts(loadedProducts);
      } catch (error) {
        console.error('DatabaseProvider: error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  console.log('DatabaseProvider: rooms, products, isLoading', { rooms, products, isLoading });
  const addRoom = async (room) => {
    const newRooms = [...rooms, room];
    await storage.setRooms(newRooms);
    setRooms(newRooms);
    return room;
  };

  const updateRoom = async (id, updates) => {
    const newRooms = rooms.map(room => 
      room.id === id ? { ...room, ...updates } : room
    );
    await storage.setRooms(newRooms);
    setRooms(newRooms);
  };

  const deleteRoom = async (id) => {
    const newRooms = rooms.filter(room => room.id !== id);
    await storage.setRooms(newRooms);
    setRooms(newRooms);
  };

  const addProduct = async (product) => {
    const savedProduct = await storage.addProduct(product);
    setProducts([...products, savedProduct]);
    
    // Schedule warranty notifications if product has warranty
    if (savedProduct.warranty) {
      await scheduleWarrantyNotifications(savedProduct);
    }
    
    return savedProduct;
  };

  const updateProduct = async (id, updates) => {
    const updatedProduct = await storage.updateProduct(id, updates);
    setProducts(products.map(p => 
      p.id === id ? updatedProduct : p
    ));
    
    // Reschedule notifications if warranty changed
    if (updates.warranty !== undefined) {
      await rescheduleProductNotifications(updatedProduct);
    }
    
    return updatedProduct;
  };

  const deleteProduct = async (id) => {
    await storage.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
    
    // Cancel all notifications for this product
    await cancelProductNotifications(id);
  };

  const value = {
    rooms,
    products,
    isLoading,
    addRoom,
    updateRoom,
    deleteRoom,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};