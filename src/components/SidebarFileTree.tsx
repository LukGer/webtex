import { DragAndDropContext, type IDragAndDropContext } from "@/utils/dnd";
import { WorkspaceContext } from "@/utils/files";
import { Collapsible } from "@radix-ui/react-collapsible";
import { cva } from "class-variance-authority";
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { use } from "react";
import { CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "./ui/sidebar";

type ItemAction = {
  id: string;
  name: string;
  icon: React.ReactNode;
  variant?: "destructive" | "default";
  onClick: () => void;
};

type FileTreeRootItem = {
  type: "root";
  path: string;
  handle: FileSystemDirectoryHandle;
  actions: ItemAction[];
};

type FileTreeFileItem = {
  type: "file";
  path: string;
  handle: FileSystemFileHandle;
  actions: ItemAction[];
};

type FileTreeFolderItem = {
  type: "folder";
  path: string;
  handle: FileSystemDirectoryHandle;
  actions: ItemAction[];
};

type FileTreeItem = FileTreeRootItem | FileTreeFileItem | FileTreeFolderItem;

const handleDragOver = (
  e: React.DragEvent,
  dndContext: IDragAndDropContext,
  path: string
) => {
  e.preventDefault();
  e.stopPropagation();

  if (
    dndContext.draggedItemPath !== null &&
    dndContext.draggedItemPath !== path
  ) {
    dndContext.setDropTargetPath(path);
  }
};

const handleDrop = (e: React.DragEvent, dndContext: IDragAndDropContext) => {
  e.preventDefault();

  if (
    dndContext.draggedItemPath !== null &&
    dndContext.dropTargetPath !== null
  ) {
    dndContext.onItemDropped(
      dndContext.draggedItemPath,
      dndContext.dropTargetPath
    );
  }

  dndContext.setDropTargetPath(null);
  dndContext.setDraggedItemPath(null);
};

const handleDragLeave = (dndContext: IDragAndDropContext, path: string) => {
  if (dndContext.dropTargetPath === path) {
    dndContext.setDropTargetPath(null);
  }
};

const rootItemVariants = cva("rounded-md transition-colors", {
  variants: {
    isDropTarget: {
      true: "bg-primary/10",
      false: "bg-transparent",
    },
  },
});

const folderItemVariants = cva("rounded-md transition-colors", {
  variants: {
    isDropTarget: {
      true: "bg-primary/10",
      false: "bg-transparent",
    },
  },
});

export default function SidebarFileTree({
  item,
  children,
}: {
  item: FileTreeItem;
  children?: React.ReactNode[];
}) {
  const path = item.path;
  const name = item.path.split("/").pop() ?? "";
  const dndContext = use(DragAndDropContext)!;

  if (item.type === "root") {
    const isDropTarget =
      dndContext.dropTargetPath === item.path &&
      dndContext.draggedItemPath !== item.path;

    return (
      <SidebarMenu
        className={rootItemVariants({ isDropTarget })}
        onDragOver={(e) => handleDragOver(e, dndContext, path)}
        onDrop={(e) => handleDrop(e, dndContext)}
      >
        <SidebarMenuItem>
          <SidebarGroupLabel>Your files</SidebarGroupLabel>

          <ItemActions item={item} />
        </SidebarMenuItem>

        {...children ?? []}
      </SidebarMenu>
    );
  }

  if (item.type === "file") {
    const context = use(WorkspaceContext);

    return (
      <SidebarMenuItem
        draggable={true}
        onDragStart={() => dndContext.setDraggedItemPath(path)}
      >
        <SidebarMenuButton
          isActive={context.selectedPath === path}
          className="flex flex-row items-center"
          onClick={() => context.setSelectedPath(path)}
        >
          <FileIcon />
          <span>{name}</span>

          {path === context.mainFilePath && (
            <div className="size-2 rotate-45 rounded-full bg-yellow-400" />
          )}

          <div className="flex-1" />
        </SidebarMenuButton>
        <ItemActions item={item} />
      </SidebarMenuItem>
    );
  }

  const isDropTarget =
    dndContext.dropTargetPath === item.path &&
    dndContext.draggedItemPath !== item.path;

  return (
    <SidebarMenuItem
      className={folderItemVariants({ isDropTarget })}
      onDragOver={(e) => handleDragOver(e, dndContext, path)}
      onDrop={(e) => handleDrop(e, dndContext)}
      onDragLeave={() => handleDragLeave(dndContext, path)}
    >
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={true}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className="transition-transform" />
            <FolderIcon />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>{...children ?? []}</SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
      <ItemActions item={item} />
    </SidebarMenuItem>
  );
}

function ItemActions({ item }: { item: FileTreeItem }) {
  return (
    item.actions.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction>
            <MoreHorizontalIcon />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={action.onClick}
              variant={action.variant ?? "default"}
            >
              {action.name}
              <div className="flex-1" />
              {action.icon}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
}
