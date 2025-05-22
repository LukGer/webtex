import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useMemo,
  useState,
} from "react";

export interface DraggedItemInfo {
  path: string;
  handle: FileSystemFileHandle;
  parentHandle: FileSystemDirectoryHandle;
}

export interface DropTargetInfo {
  path: string;
  handle: FileSystemDirectoryHandle;
}

export interface IDragAndDropContext {
  dropTarget: DropTargetInfo | null;
  setDropTarget: Dispatch<SetStateAction<DropTargetInfo | null>>;
  draggedItem: DraggedItemInfo | null;
  setDraggedItem: Dispatch<SetStateAction<DraggedItemInfo | null>>;
  onItemDropped: (
    draggedItem: DraggedItemInfo,
    dropTarget: DropTargetInfo
  ) => void;
}

export const DragAndDropContext = createContext<
  IDragAndDropContext | undefined
>(undefined);

interface DragAndDropProviderProps {
  onItemDropped: (
    draggedItem: DraggedItemInfo,
    dropTarget: DropTargetInfo
  ) => void;
  children: React.ReactNode;
}

export const DragAndDropProvider: React.FC<DragAndDropProviderProps> = ({
  onItemDropped,
  children,
}) => {
  const [dropTarget, setDropTarget] = useState<DropTargetInfo | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItemInfo | null>(null);

  const contextValue = useMemo(
    () => ({
      dropTarget,
      setDropTarget,
      draggedItem,
      setDraggedItem,
      onItemDropped,
    }),
    [dropTarget, draggedItem, onItemDropped]
  );

  return (
    <DragAndDropContext.Provider value={contextValue}>
      {children}
    </DragAndDropContext.Provider>
  );
};
