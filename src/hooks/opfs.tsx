import { openFolderAndLoadFiles } from "@/utils/files";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const opfsFilesQuery = queryOptions({
  queryKey: ["files"],
  queryFn: () => openFolderAndLoadFiles(),
});

export const useOpfs = () => {
  return useQuery(opfsFilesQuery);
};

const deleteEntryFunction = async ({
  parentHandle,
  name,
}: {
  parentHandle: FileSystemDirectoryHandle;
  name: string;
}) => {
  await parentHandle.removeEntry(name, { recursive: true });
};

const moveFileFunction = async ({
  sourceFileHandle,
  sourceParentHandle,
  targetDirectoryHandle,
}: {
  sourceFileHandle: FileSystemFileHandle;
  sourceParentHandle: FileSystemDirectoryHandle;
  targetDirectoryHandle: FileSystemDirectoryHandle;
}) => {
  const fileName = sourceFileHandle.name;
  const file = await sourceFileHandle.getFile();
  const newFileHandle = await targetDirectoryHandle.getFileHandle(fileName, {
    create: true,
  });
  const writable = await newFileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  await sourceParentHandle.removeEntry(sourceFileHandle.name);
};

export const useOpfsFileMutations = () => {
  const queryClient = useQueryClient();

  const deleteFileMutation = useMutation({
    mutationFn: deleteEntryFunction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opfsFilesQuery.queryKey });
    },
  });

  const moveFileMutation = useMutation({
    mutationFn: moveFileFunction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opfsFilesQuery.queryKey });
    },
  });

  return { deleteFileMutation, moveFileMutation };
};

export const useOpfsFolderMutations = () => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: opfsFilesQuery.queryKey });
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
      queryClient.invalidateQueries({ queryKey: opfsFilesQuery.queryKey });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteEntryFunction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opfsFilesQuery.queryKey });
    },
  });

  return { addFileMutation, createFolderMutation, deleteFolderMutation };
};
