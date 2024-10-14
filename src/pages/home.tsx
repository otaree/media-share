import { useEffect, useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import AddAlbum from "@/components/addAlbum";
import awsInst from "@/lib/AWSInstance";
import { MainMeta } from "@/types";

export function Home() {
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [meta, setMeta] = useState<MainMeta[]>([]);

  useEffect(() => {
    // awsInst.getFileJson("meta.json").then(setMeta);
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4">
        <Button
          className="p-4 rounded-full shadow-lg"
          onClick={() => setIsAddAlbumOpen(true)}
        >
          + Add Album
        </Button>
      </div>
      <AddAlbum
        isOpen={isAddAlbumOpen}
        onClose={() => setIsAddAlbumOpen(false)}
        onSave={() => setIsAddAlbumOpen(false)}
      />
    </>
  );
}
