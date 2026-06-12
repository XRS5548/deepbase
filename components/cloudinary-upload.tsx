"use client"

import { useState } from "react"
import { CldUploadWidget } from "next-cloudinary"
import { ImageUp, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface CloudinaryUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function CloudinaryUpload({ value, onChange }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-input bg-muted group">
          <Image src={value} alt="Uploaded image" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={(result) => {
            const info = result?.info
            if (info && typeof info !== "string" && "secure_url" in info) {
              onChange(info.secure_url)
            }
          }}
          onQueuesStart={() => setUploading(true)}
          onQueuesEnd={() => setUploading(false)}
          options={{ maxFiles: 1, clientAllowedFormats: ["png", "jpg", "jpeg", "webp", "gif"] }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
              disabled={uploading}
              className="w-full h-28 flex flex-col items-center justify-center gap-2 border-dashed"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ImageUp className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME === "your_cloud_name"
                      ? "Set Cloudinary env vars first"
                      : "Click to upload image"}
                  </span>
                </>
              )}
            </Button>
          )}
        </CldUploadWidget>
      )}
    </div>
  )
}
