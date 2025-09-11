import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (file: any) => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simplified file upload component that renders as a button and handles direct upload
 * to cloud storage.
 * 
 * Features:
 * - Renders as a customizable button that triggers file selection
 * - Handles direct upload to cloud storage (Google Cloud Storage, AWS S3, etc.)
 * - Shows upload progress and status
 * - Validates file size and type
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct upload.
 * @param props.onComplete - Callback function called when upload is complete.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
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
      // Get upload parameters from the backend
      const uploadParams = await onGetUploadParameters(file);
      
      // Upload the file directly to cloud storage
      const uploadResponse = await fetch(uploadParams.url, {
        method: uploadParams.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResponse.ok) {
        toast({
          title: "Upload Successful",
          description: "Your file has been uploaded successfully!",
        });

        // Call the onComplete callback with upload result
        onComplete?.({
          successful: [{ 
            id: `upload-${Date.now()}`,
            name: file.name,
            size: file.size,
            uploadURL: uploadParams.url.split('?')[0], // Remove query params to get clean URL
          }],
          failed: [],
        });
      } else {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
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
      />
      <Button 
        onClick={() => {
          const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
          fileInput?.click();
        }}
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : children}
      </Button>
    </div>
  );
}