// Backup/Export data helper using FileSystem and Sharing.
// Exports products, rooms, settings to JSON file and offers share dialog.
// Import reads JSON and restores to AsyncStorage.

export async function exportData() {
  try {
    // Prefer require in Jest/Node to avoid dynamic import vm module flag
    let FileSystem, Sharing, storage;
    try {
      // eslint-disable-next-line global-require
      FileSystem = require('expo-file-system');
      // Handle CommonJS default export
      if (FileSystem.default) FileSystem = FileSystem.default;
      // eslint-disable-next-line global-require
      Sharing = require('expo-sharing');
      if (Sharing.default) Sharing = Sharing.default;
      // eslint-disable-next-line global-require
      storage = require('./storage');
    } catch (e) {
      FileSystem = await import('expo-file-system');
      Sharing = await import('expo-sharing');
      storage = await import('./storage');
    }

    const data = {
      products: await storage.storage.getProducts(),
      rooms: await storage.storage.getRooms(),
      settings: await storage.storage.getSettings(),
      user: await storage.storage.getUser(),
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const filename = `engram-backup-${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, json);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      // Share the backup file
      await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: 'Export Engram Data' });
      return filePath;
    }
    return filePath;
  } catch (e) {
    console.warn('Export failed', e);
    throw e;
  }
}

export async function importData(fileUri) {
  try {
    let FileSystem, storage;
    try {
      FileSystem = require('expo-file-system');
      // Handle CommonJS default export
      if (FileSystem.default) FileSystem = FileSystem.default;
      storage = require('./storage');
    } catch (e) {
      FileSystem = await import('expo-file-system');
      storage = await import('./storage');
    }

    const json = await FileSystem.readAsStringAsync(fileUri);
    const data = JSON.parse(json);

    if (data.products) await storage.storage.setProducts(data.products);
    if (data.rooms) await storage.storage.setRooms(data.rooms);
    if (data.settings) await storage.storage.setSettings(data.settings);
    if (data.user) await storage.storage.setUser(data.user);

    return { success: true, imported: Object.keys(data).filter(k => k !== 'exportedAt') };
  } catch (e) {
    console.warn('Import failed', e);
    throw e;
  }
}
