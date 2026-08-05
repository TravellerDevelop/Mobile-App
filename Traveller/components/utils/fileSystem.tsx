import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from "expo-media-library";
import { imageFileName, resolveImageUri } from '../../shared/imageUrl';

export const isFilePresent = async (filePath: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

export const savePostToGallery = async (url: string) => {
  const filePath =
    FileSystem.documentDirectory + "post" + imageFileName(url);

  if (!(await isFilePresent(filePath))) {
    try {
      const downloadedFile =
        await FileSystem.downloadAsync(
          // `url` è già una stringa non vuota (tipo del parametro): resolveImageUri
          // torna undefined solo per input falsy, qui non applicabile.
          resolveImageUri(url, "userImage/posts/")!,
          filePath
        );

      if (downloadedFile.uri) {
        await MediaLibrary.saveToLibraryAsync(
          downloadedFile.uri
        );
      } else {
        console.error(
          "Error downloading the image:",
          downloadedFile
        );
      }
    } catch (error) {
      console.error(
        "Error saving image to gallery:",
        error
      );
    }
  } else {
    await MediaLibrary.saveToLibraryAsync(filePath);
  }
}