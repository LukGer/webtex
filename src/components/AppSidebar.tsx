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
  SidebarHeader,
  SidebarMenu,
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
} from "lucide-react";
import { use, useRef, type PropsWithChildren } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

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

  return (
    <Sidebar>
      <SidebarHeader>
        <span className="truncate font-semibold text-xl">WebTeX</span>
      </SidebarHeader>
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
                  <Tree key={index} item={item} />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

function Tree({ item }: { item: TreeItem }) {
  const name = item.path.split("/").pop() ?? "";

  if (item.type === "file") {
    const context = use(WorkspaceContext);

    return (
      <SidebarMenuButton
        isActive={context.selectedFile?.path === item.path}
        className="data-[active=true]:bg-transparent"
        onClick={() =>
          context.setSelectedPath({ path: item.path, fileHandle: item.handle })
        }
      >
        <FileIcon />
        {name}
      </SidebarMenuButton>
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
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
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
