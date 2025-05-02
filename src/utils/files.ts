import { createContext } from "react";

export type FileItem = {
  path: string;
  type: "file";
  handle: FileSystemFileHandle;
};

export type FolderItem = {
  path: string;
  type: "folder";
  children: TreeItem[];
  handle: FileSystemDirectoryHandle;
};

export type TreeItem = FileItem | FolderItem;

export async function openFolderAndLoadFiles() {
  const root = await navigator.storage.getDirectory();

  const files = await loadFolderItems(root);

  files.sort((a, b) => {
    if (a.type === "folder" && b.type === "file") {
      return -1;
    } else if (a.type === "file" && b.type === "folder") {
      return 1;
    } else {
      return a.path.localeCompare(b.path);
    }
  });

  return { root, files };
}

async function loadFolderItems(
  handle: FileSystemDirectoryHandle
): Promise<TreeItem[]> {
  const files: TreeItem[] = [];

  for await (const [key, value] of handle.entries()) {
    if (value.kind === "file") {
      const fileHandle = value as FileSystemFileHandle;
      const fileItem: FileItem = {
        path: key,
        type: "file",
        handle: fileHandle,
      };
      files.push(fileItem);
    } else if (value.kind === "directory") {
      const folderHandle = value as FileSystemDirectoryHandle;
      const folderItem: FolderItem = {
        path: key,
        type: "folder",
        children: await loadFolderItems(folderHandle),
        handle: folderHandle,
      };

      files.push(folderItem);
    }
  }

  return files;
}

export interface SelectedFile {
  path: string;
  fileHandle: FileSystemFileHandle;
}

export interface WorkspaceContext {
  selectedFile: SelectedFile | null;
  setSelectedFile: (path: SelectedFile | null) => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>({
  selectedFile: null,
  setSelectedFile: () => {},
});
