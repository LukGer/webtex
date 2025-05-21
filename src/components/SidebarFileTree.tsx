import { DragAndDropContext } from "@/utils/dnd";
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

type FileTreeItem = FileTreeFileItem | FileTreeFolderItem;

const folderItemVariants = cva("bg-transparent rounded-md transition-colors", {
  variants: {
    isDropTarget: {
      true: "bg-blue-400/10",
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
  const name = item.path.split("/").pop() ?? "";
  const dndContext = use(DragAndDropContext);

  if (item.type === "file") {
    const context = use(WorkspaceContext);

    return (
      <SidebarMenuItem
        draggable={true}
        onDragStart={() => dndContext?.setDraggedItemPath(item.path)}
      >
        <SidebarMenuButton
          isActive={context.selectedPath === item.path}
          className="flex flex-row items-center"
          onClick={() => context.setSelectedPath(item.path)}
        >
          <FileIcon />
          <span>{name}</span>

          {item.path === context.mainFilePath && (
            <div className="size-2 rotate-45 rounded-full bg-yellow-400" />
          )}

          <div className="flex-1" />
        </SidebarMenuButton>
        <ItemActions item={item} />
      </SidebarMenuItem>
    );
  }

  const isCurrentDropTarget =
    dndContext?.dropTargetPath === item.path &&
    dndContext?.draggedItemPath !== item.path;

  return (
    <SidebarMenuItem
      className={folderItemVariants({ isDropTarget: isCurrentDropTarget })}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (
          dndContext?.draggedItemPath &&
          dndContext.draggedItemPath !== item.path
        ) {
          dndContext?.setDropTargetPath(item.path);
        }
      }}
      onDragLeave={() => {
        if (dndContext?.dropTargetPath === item.path) {
          dndContext?.setDropTargetPath(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();

        if (!dndContext?.draggedItemPath || !dndContext.dropTargetPath) {
        } else {
          dndContext.onItemDropped(
            dndContext.draggedItemPath,
            dndContext.dropTargetPath
          );
        }

        dndContext?.setDropTargetPath(null);
        dndContext?.setDraggedItemPath(null);
      }}
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
