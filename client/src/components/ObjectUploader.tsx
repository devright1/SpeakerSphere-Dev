import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: ReactNode;
  imageType?: string;
  entityId?: string;
  ownerType?: string;
}

/**
 * A simplified file upload component that renders as a button and handles direct upload
 * to database storage.
 * 
 * Features:
 * - Renders as a customizable button that triggers file selection
 * - Handles direct upload to database storage via API
 * - Shows upload progress and status
 * - Validates file size and type
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onComplete - Callback function called when upload is complete.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 * @param props.imageType - Type of image being uploaded (e.g., 'profile', 'headshot')
 * @param props.entityId - ID of the entity this image belongs to
 * @param props.ownerType - Type of owner (e.g., 'user', 'speaker')
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  children,
  imageType = "profile",
  entityId,
  ownerType = "user",
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputId] = useState(() => `file-upload-${Math.random().toString(36).substr(2, 9)}`);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only handle first file for now

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File Too Large",
        description: `Please select a file smaller than ${Math.round(maxFileSize / (1024 * 1024))}MB.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type", 
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload the file to our database storage endpoint
      const formData = new FormData();
      formData.append('image', file);
      formData.append('imageType', imageType);
      formData.append('ownerType', ownerType);
      if (entityId) {
        formData.append('entityId', entityId);
      }

      const uploadResponse = await fetch('/api/images', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookie
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        
        toast({
          title: "Upload Successful",
          description: result.message || "Your image has been uploaded successfully!",
        });

        // Call the onComplete callback with upload result
        onComplete?.({
          successful: [{ 
            id: result.imageId,
            name: file.name,
            size: file.size,
            uploadURL: result.imageUrl, // Database image URL
            imageId: result.imageId,
          }],
          failed: [],
        });
      } else {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status: ${uploadResponse.status}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id={fileInputId}
        disabled={isUploading}
        data-testid="file-input-hidden"
      />
      <Button 
        onClick={() => {
          const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
          fileInput?.click();
        }}
        className={buttonClassName}
        disabled={isUploading}
        data-testid="button-upload-image"
      >
        {isUploading ? "Uploading..." : children}
      </Button>
    </div>
  );
}