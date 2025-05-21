import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useMemo,
  useState,
} from "react";

interface DragAndDropContext {
  dropTargetPath: string | null;
  setDropTargetPath: Dispatch<SetStateAction<string | null>>;
  draggedItemPath: string | null;
  setDraggedItemPath: Dispatch<SetStateAction<string | null>>;
  onItemDropped: (itemPath: string, targetPath: string) => void;
}

export const DragAndDropContext = createContext<DragAndDropContext | undefined>(
  undefined
);

interface DragAndDropProviderProps {
  onItemDropped: (itemPath: string, targetPath: string) => void;
  children: React.ReactNode;
}

export const DragAndDropProvider: React.FC<DragAndDropProviderProps> = ({
  onItemDropped,
  children,
}) => {
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);
  const [draggedItemPath, setDraggedItemPath] = useState<string | null>(null);

  const contextValue = useMemo(
    () => ({
      dropTargetPath,
      setDropTargetPath,
      draggedItemPath,
      setDraggedItemPath,
      onItemDropped,
    }),
    [dropTargetPath, draggedItemPath, onItemDropped]
  );

  return (
    <DragAndDropContext.Provider value={contextValue}>
      {children}
    </DragAndDropContext.Provider>
  );
};
