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
} from "@/components/ui/sidebar";
import {
  useOpfs,
  useOpfsFileMutations,
  useOpfsFolderMutations,
} from "@/hooks/opfs";
import { DragAndDropProvider } from "@/utils/dnd";
import type { TreeItem } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import { FilePlusIcon, FolderPlusIcon, TrashIcon } from "lucide-react";
import { type PropsWithChildren, useRef, useState } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import SidebarFileTree from "./SidebarFileTree";

export function AppSidebar() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const opfsQuery = useOpfs();

  const fileMutations = useOpfsFileMutations();
  const folderMutations = useOpfsFolderMutations();

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

  function FileTree({ item }: { item: TreeItem }) {
    if (item.type === "root") {
      return (
        <SidebarFileTree
          item={{
            type: "root",
            path: item.path,
            handle: item.handle,
            actions: [
              {
                id: "upload",
                name: "Upload File",
                icon: <FolderPlusIcon className="size-4" />,
                onClick: async () => {
                  if (!item.handle) return;
                  await uploadFileMutation.mutateAsync({
                    folder: item.handle,
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

    if (item.type === "file") {
      return (
        <SidebarFileTree
          item={{
            type: "file",
            path: item.path,
            handle: item.handle,
            parentHandle: item.parentHandle,
            actions: [
              {
                id: "delete",
                name: "Delete",
                icon: <TrashIcon className="size-4" />,
                variant: "destructive",
                onClick: async () => {
                  if (!item.handle) return;
                  await fileMutations.deleteFileMutation.mutateAsync({
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
          parentHandle: item.parentHandle,
          actions: [
            {
              id: "add-file",
              name: "Add File",
              icon: <FilePlusIcon className="size-4" />,
              onClick: async () => {
                console.log("Add file clicked");
              },
            },
            {
              id: "create-folder",
              name: "Create Folder",
              icon: <FolderPlusIcon className="size-4" />,
              onClick: async () => {
                if (!item.handle) return;
                const name = prompt("Folder name");
                if (!name) return;
                await folderMutations.createFolderMutation.mutateAsync({
                  parentHandle: item.handle,
                  name,
                });
              },
            },
            {
              id: "delete-folder",
              name: "Delete Folder",
              variant: "destructive",
              icon: <TrashIcon className="size-4" />,
              onClick: async () => {
                await folderMutations.deleteFolderMutation.mutateAsync({
                  parentHandle: item.handle,
                  name: item.path,
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
              {opfsQuery.isSuccess && (
                <DragAndDropProvider
                  onItemDropped={(draggedItem, dropTarget) => {
                    fileMutations.moveFileMutation.mutate({
                      sourceFileHandle: draggedItem.handle,
                      sourceParentHandle: draggedItem.parentHandle,
                      targetDirectoryHandle: dropTarget.handle,
                    });
                  }}
                >
                  <FileTree item={opfsQuery.data} />
                </DragAndDropProvider>
              )}
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

          folderMutations.addFileMutation.mutate({
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
