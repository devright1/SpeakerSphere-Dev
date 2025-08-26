import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Download, Lock } from "lucide-react";

interface AccessCodeDialogProps {
  contentId: number;
  fileName: string;
  onDownloadSuccess: () => void;
}

export function AccessCodeDialog({ contentId, fileName, onDownloadSuccess }: AccessCodeDialogProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const downloadWithCodeMutation = useMutation({
    mutationFn: async () => {
      if (!accessCode.trim()) {
        throw new Error("Please enter an access code");
      }

      // Get user authentication for access code downloads
      const userData = localStorage.getItem('userData');
      if (!userData) {
        throw new Error('Authentication required to download content');
      }
      
      let userId;
      try {
        const user = JSON.parse(userData);
        userId = user.id;
      } catch (error) {
        throw new Error('Authentication required to download content');
      }

      // Trigger direct download with authentication
      const downloadUrl = `/api/content/${contentId}/download?accessCode=${accessCode.trim().toUpperCase()}&userId=${userId}`;
      
      // Use window.open for better download handling in sandboxed environments
      const downloadWindow = window.open(downloadUrl, '_blank');
      
      // Fallback: if popup blocked, try direct navigation
      if (!downloadWindow) {
        window.location.href = downloadUrl;
      }
      
      return { fileName: fileName, success: true };
    },
    onSuccess: () => {
      toast({
        title: "Access Granted",
        description: "Download started successfully!",
      });
      setAccessCode("");
      setIsOpen(false);
      onDownloadSuccess();
    },
    onError: (error) => {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    downloadWithCodeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="h-4 w-4" />
          Enter Access Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Code Required
          </DialogTitle>
          <DialogDescription>
            This content requires a 4-letter access code from the speaker.
            <br />
            <strong>File:</strong> {fileName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              placeholder="Enter 4-letter code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="text-center font-mono text-lg tracking-widest"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={downloadWithCodeMutation.isPending || accessCode.length !== 4}
              className="gap-2"
            >
              {downloadWithCodeMutation.isPending ? (
                "Verifying..."
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}