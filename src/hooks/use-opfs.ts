import { openFolderAndLoadFiles } from "@/utils/files";
import { useQuery } from "@tanstack/react-query";

export const useOpfs = () => {
  return useQuery({
    queryKey: ["files"],
    queryFn: () => openFolderAndLoadFiles(),
  });
};
