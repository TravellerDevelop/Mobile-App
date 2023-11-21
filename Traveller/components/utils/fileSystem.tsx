import * as FileSystem from 'expo-file-system';
import { serverLink } from '../../global/globalVariable';
import * as MediaLibrary from "expo-media-library";

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
    FileSystem.documentDirectory + "post" + url;

  if (!(await isFilePresent(filePath))) {
    try {
      const downloadedFile =
        await FileSystem.downloadAsync(
          serverLink + "userImage/posts/" + url,
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