// Photo persistence helper using Expo FileSystem with dynamic import.
// Copies a source URI into the app's document directory to ensure it's not removed by the OS.
// Returns the new URI or the original if copy fails.

function filenameFromUri(uri) {
  try {
    const idx = uri.lastIndexOf('/')
    return idx >= 0 ? uri.slice(idx + 1) : `photo-${Date.now()}.jpg`;
  } catch {
    return `photo-${Date.now()}.jpg`;
  }
}

export async function persistPhoto(uri) {
  try {
    const FileSystem = await import('expo-file-system');
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
    const name = filenameFromUri(uri);
    const dest = `${FileSystem.documentDirectory || 'file:///data/user/0/app/'}${Date.now()}-${name}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (e) {
    console.warn('persistPhoto failed, falling back to original uri', e?.message);
    return uri;
  }
}
