"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { CentuariButton } from "@/components/centuari-button";
import { UploadCloud, X } from "lucide-react";

export function SubmitProofDialog() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
    },
    multiple: true,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="primary"
          className="shrink-0 2xl:h-10 2xl:px-5 2xl:text-base"
        >
          Claim
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px]" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl" />
          </div>

          <div className="mt-6 px-6 flex flex-col gap-4 z-50">
            <h1 className="text-2xl font-semibold text-white">
              Submit proof of mission
            </h1>

            <div
              {...getRootProps()}
              className={`border border-dashed h-[160px] rounded-lg p-6 flex flex-col items-center justify-center text-sm cursor-pointer transition
              ${isDragActive ? "bg-white/5" : "bg-white/5"}`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mb-4" />
              <p className="text-muted-foreground text-sm">
                Drag and drop your proof of mission.
              </p>
              <p className="text-muted-foreground text-sm">
                Upload (PNG, JPG, or JPEG)
              </p>
            </div>

            {/* File list */}
            <div className="flex flex-col gap-2 max-h-48 overflow-auto">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between bg-white/5 border border-white/10 px-3 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                      📄
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm">{file.name}</span>
                      <span className="text-gray-400 text-xs">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB · JPG
                      </span>
                    </div>
                  </div>

                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={() => removeFile(file.name)}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="flex-row items-center justify-end px-6 py-4">
          <DialogClose asChild>
            <CentuariButton variant="secondary" className="flex-1">
              Cancel
            </CentuariButton>
          </DialogClose>
          <Button type="button" variant={"primary"} className="flex-1" disabled={files.length === 0}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
