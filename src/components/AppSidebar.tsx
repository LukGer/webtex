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
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOpfs } from "@/hooks/use-opfs";
import { DragAndDropProvider } from "@/utils/dnd";
import type { TreeItem } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import {
  FilePlusIcon,
  FolderPlusIcon,
  MoreHorizontalIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { type PropsWithChildren, useRef, useState } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import SidebarFileTree from "./SidebarFileTree";
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

  function FileTree({ item }: { item: TreeItem }) {
    if (item.type === "file") {
      return (
        <SidebarFileTree
          item={{
            type: "file",
            path: item.path,
            handle: item.handle,
            actions: [
              {
                id: "delete",
                name: "Delete",
                icon: <TrashIcon className="size-4" />,
                variant: "destructive",
                onClick: async () => {
                  if (!item.handle) return;
                  await deleteFileMutation.mutateAsync({
                    parentHandle: item.parentHandle,
                    name: item.path,
                  });
                },
              },
            ],
          }}
        />
      );
    }

    return (
      <SidebarFileTree
        item={{
          type: "folder",
          path: item.path,
          handle: item.handle,
          actions: [
            {
              id: "create-folder",
              name: "Create Folder",
              icon: <FolderPlusIcon className="size-4" />,
              onClick: async () => {
                if (!item.handle) return;
                const name = prompt("Folder name");
                if (!name) return;
                await createFolderMutation.mutateAsync({
                  parentHandle: item.handle,
                  name,
                });
              },
            },
          ],
        }}
      >
        {item.children.map((child) => (
          <FileTree key={child.path} item={child} />
        ))}
      </SidebarFileTree>
    );
  }

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
                            folder: opfsQuery.data.handle,
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

                {opfsQuery.isSuccess && (
                  <DragAndDropProvider
                    onItemDropped={(itemPath, targetPath) => {
                      alert(`Item dropped: ${itemPath}, ${targetPath}`);
                    }}
                  >
                    <FileTree item={opfsQuery.data} />
                  </DragAndDropProvider>
                )}
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
            root: opfsQuery.data.handle,
            path,
          });
        }}
      />
    </>
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
