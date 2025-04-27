import { createContext, use } from "react";

type File = {
  name: string;
  path: string;
};

export interface SelectedFileContextType {
  files: File[];
  selectedFilePath: string;
  setFiles: (files: File[]) => void;
  setSelectedFilePath: (path: string) => void;
}

export const SelectedFileContex = createContext<SelectedFileContextType>({
  files: [],
  selectedFilePath: "",
  setFiles: () => {},
  setSelectedFilePath: () => {},
});

export const useFiles = () => {
  const context = use(SelectedFileContex);

  return context;
};
