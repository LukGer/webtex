import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { useOpfs } from "@/hooks/use-opfs";
import { WorkspaceContext, type TreeItem } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import { use, useRef, type PropsWithChildren } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function AppSidebar() {
  const opfsQuery = useOpfs();

  const addFileMutation = useMutation({
    mutationFn: async ({
      root,
      path,
    }: {
      root: FileSystemDirectoryHandle;
      path: string;
    }) => {
      const directories = path.split("/");
      const fileName = directories.pop()!;

      let parentDirectoryHandle = root;

      for (const dir of directories) {
        parentDirectoryHandle = await parentDirectoryHandle.getDirectoryHandle(
          dir,
          {
            create: true,
          }
        );
      }

      await parentDirectoryHandle.getFileHandle(fileName, {
        create: true,
      });
    },
    onSuccess: () => {
      opfsQuery.refetch();
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async ({
      parentHandle,
      name,
    }: {
      parentHandle: FileSystemDirectoryHandle;
      name: string;
    }) => {
      await parentHandle.removeEntry(name, { recursive: true });
    },
    onSuccess: () => {
      opfsQuery.refetch();
    },
  });

  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Files</SidebarGroupLabel>
            <SidebarMenu>
              <AddFileDialog
                onSubmit={(path) => {
                  if (!opfsQuery.isSuccess) return;

                  addFileMutation.mutate({
                    root: opfsQuery.data.root,
                    path,
                  });
                }}
              >
                <SidebarMenuButton>
                  <FilePlusIcon />
                  New File
                </SidebarMenuButton>
              </AddFileDialog>

              <hr />

              {opfsQuery.isSuccess &&
                opfsQuery.data.files.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    parentHandle={opfsQuery.data.root}
                    onDeleteItem={(parentHandle, name) =>
                      deleteFileMutation.mutate({ parentHandle, name })
                    }
                  />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

function Tree({
  item,
  parentHandle,
  onDeleteItem,
}: {
  item: TreeItem;
  parentHandle: FileSystemDirectoryHandle;
  onDeleteItem: (parentHandle: FileSystemDirectoryHandle, name: string) => void;
}) {
  const name = item.path.split("/").pop() ?? "";

  if (item.type === "file") {
    const context = use(WorkspaceContext);

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={context.selectedFile?.path === item.path}
          className="flex flex-row items-center"
          onClick={() =>
            context.setSelectedPath({
              path: item.path,
              fileHandle: item.handle,
            })
          }
        >
          <FileIcon />
          <span>{name}</span>

          <div className="flex-1"></div>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction>
              <MoreHorizontalIcon />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename File</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                const name = item.path.split("/").pop() ?? "";
                onDeleteItem(parentHandle, name);
              }}
            >
              Delete File
              <TrashIcon className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === "components" || name === "ui"}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className="transition-transform" />
            <FolderIcon />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((subItem, index) => (
              <Tree
                key={index}
                item={subItem}
                parentHandle={item.handle}
                onDeleteItem={onDeleteItem}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction>
            <MoreHorizontalIcon />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              const name = item.path.split("/").pop() ?? "";
              onDeleteItem(parentHandle, name);
            }}
          >
            Delete Folder
            <TrashIcon className="ml-2 h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function AddFileDialog(
  props: PropsWithChildren<{ onSubmit: (name: string) => void }>
) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new file</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              ref={inputRef}
              id="name"
              placeholder="File name"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={() => {
                const name = inputRef.current?.value;
                if (!name) return;
                props.onSubmit(name);
              }}
              type="submit"
            >
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
