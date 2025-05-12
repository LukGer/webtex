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
import { type TreeItem, WorkspaceContext } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  FolderPlusIcon,
  MoreHorizontalIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { type PropsWithChildren, use, useRef, useState } from "react";
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
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const uploadFileMutation = useMutation({
    mutationFn: async ({ folder }: { folder: FileSystemDirectoryHandle }) => {
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const writable = await folder.getFileHandle(file.name, {
        create: true,
      });
      const writableStream = await writable.createWritable();
      await writableStream.write(file);
      await writableStream.close();
    },
    onSuccess: () => {
      opfsQuery.refetch();
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({
      parentHandle,
      name,
    }: {
      parentHandle: FileSystemDirectoryHandle;
      name: string;
    }) => {
      await parentHandle.getDirectoryHandle(name, { create: true });
    },
    onSuccess: () => {
      opfsQuery.refetch();
    },
  });

  return (
    <>
      <Sidebar collapsible="offcanvas">
        <AppSidebarHeader />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarGroupLabel>Files</SidebarGroupLabel>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction>
                        <MoreHorizontalIcon />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                        New File
                        <div className="flex-1" />
                        <FilePlusIcon className="size-4" />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!opfsQuery.isSuccess) return;
                          uploadFileMutation.mutate({
                            folder: opfsQuery.data.root,
                          });
                        }}
                      >
                        Upload File
                        <div className="flex-1" />
                        <UploadIcon className="size-4" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                <hr />

                {opfsQuery.isSuccess &&
                  opfsQuery.data.files.map((item) => (
                    <Tree
                      key={item.path}
                      item={item}
                      parentHandle={opfsQuery.data.root}
                      onDeleteItem={(parentHandle, name) =>
                        deleteFileMutation.mutate({ parentHandle, name })
                      }
                      onUploadFile={(folder) => {
                        uploadFileMutation.mutate({ folder });
                      }}
                      onCreateFolder={(folder) => {
                        createFolderMutation.mutate({
                          parentHandle: folder,
                          name: "New Folder",
                        });
                      }}
                    />
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <AddFileDialog
        open={dialogOpen}
        onSubmit={(path) => {
          setDialogOpen(false);

          if (!opfsQuery.isSuccess) return;

          addFileMutation.mutate({
            root: opfsQuery.data.root,
            path,
          });
        }}
      />
    </>
  );
}

function Tree({
  item,
  parentHandle,
  onDeleteItem,
  onUploadFile,
  onCreateFolder,
}: {
  item: TreeItem;
  parentHandle: FileSystemDirectoryHandle;
  onDeleteItem: (parentHandle: FileSystemDirectoryHandle, name: string) => void;
  onUploadFile: (folder: FileSystemDirectoryHandle) => void;
  onCreateFolder: (folder: FileSystemDirectoryHandle) => void;
}) {
  const name = item.path.split("/").pop() ?? "";

  if (item.type === "file") {
    const context = use(WorkspaceContext);

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={context.selectedPath === item.path}
          className="flex flex-row items-center"
          onClick={() => context.setSelectedPath(item.path)}
        >
          <FileIcon />
          <span>{name}</span>

          <div className="flex-1" />
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
          <SidebarMenuSub>
            {item.children.map((subItem) => (
              <Tree
                key={subItem.path}
                item={subItem}
                parentHandle={item.handle}
                onDeleteItem={onDeleteItem}
                onUploadFile={onUploadFile}
                onCreateFolder={onCreateFolder}
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
            onClick={() => {
              onUploadFile(item.handle);
            }}
          >
            Upload File
            <div className="flex-1" />
            <UploadIcon className="h-4 w-4" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCreateFolder(item.handle);
            }}
          >
            Create Folder
            <div className="flex-1" />
            <FolderPlusIcon className="h-4 w-4" />
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              const name = item.path.split("/").pop() ?? "";
              onDeleteItem(parentHandle, name);
            }}
          >
            Delete Folder
            <div className="flex-1" />
            <TrashIcon className="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function AddFileDialog(
  props: PropsWithChildren<{ open: boolean; onSubmit: (name: string) => void }>
) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={props.open}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new file</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Path
            </Label>
            <Input
              ref={inputRef}
              id="name"
              placeholder="path/to/file.tex"
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
