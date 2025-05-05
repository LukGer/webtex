"use client";

import { BlocksIcon, FileIcon } from "lucide-react";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { WorkspaceContext } from "@/utils/files";

export interface FileSelectionDialogProps {
  onCommandSelect: (command: string, payload?: any) => void;
}

export function FileSelectionDialog(props: FileSelectionDialogProps) {
  const { files } = React.useContext(WorkspaceContext);

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onCommandSelect = (command: string, payload?: any) => {
    setOpen(false);
    props.onCommandSelect(command, payload);
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for a file or command..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Commands">
            <CommandItem onSelect={() => onCommandSelect("compile")}>
              <BlocksIcon />
              <span>Compile PDF</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Files">
            {files.map((file) => (
              <CommandItem
                onSelect={() => onCommandSelect("open", file.path)}
                key={file.path}
              >
                <FileIcon />
                <span>{file.path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
