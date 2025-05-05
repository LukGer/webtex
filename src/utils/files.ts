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

  const files = await loadFolderItems(root, "");

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
  handle: FileSystemDirectoryHandle,
  currentPath: string
): Promise<TreeItem[]> {
  const files: TreeItem[] = [];

  for await (const [key, value] of handle.entries()) {
    const itemPath = currentPath ? `${currentPath}/${key}` : key;

    if (value.kind === "file") {
      const fileHandle = value as FileSystemFileHandle;
      const fileItem: FileItem = {
        path: itemPath,
        type: "file",
        handle: fileHandle,
      };
      files.push(fileItem);
    } else if (value.kind === "directory") {
      const folderHandle = value as FileSystemDirectoryHandle;
      const folderItem: FolderItem = {
        path: itemPath,
        type: "folder",
        children: await loadFolderItems(folderHandle, itemPath), // Pass the new path recursively
        handle: folderHandle,
      };

      files.push(folderItem);
    }
  }

  files.sort((a, b) => {
    if (a.type === "folder" && b.type === "file") {
      return -1;
    } else if (a.type === "file" && b.type === "folder") {
      return 1;
    } else {
      const aName = a.path.split("/").pop() || "";
      const bName = b.path.split("/").pop() || "";
      return aName.localeCompare(bName);
    }
  });

  return files;
}

export interface SelectedFile {
  path: string;
  fileHandle: FileSystemFileHandle;
}

export interface WorkspaceContext {
  files: TreeItem[];
  selectedPath: string | null;
  setSelectedPath: (path: string | null) => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>({
  files: [],
  selectedPath: null,
  setSelectedPath: () => {},
});

function findItemByPath(
  items: TreeItem[],
  targetPath: string
): TreeItem | null {
  for (const item of items) {
    if (item.path === targetPath) {
      return item;
    }
    if (item.type === "folder") {
      if (targetPath.startsWith(item.path + "/")) {
        const foundInChildren = findItemByPath(item.children, targetPath);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }
  }
  return null;
}

export function getSelectedFile(
  files: TreeItem[],
  selectedPath: string | null
): SelectedFile | null {
  if (!selectedPath) return null;

  const foundItem = findItemByPath(files, selectedPath);

  if (foundItem && foundItem.type === "file") {
    return { path: foundItem.path, fileHandle: foundItem.handle };
  }

  return null;
}
