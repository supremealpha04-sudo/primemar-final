"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Image,
  Video,
  BarChart3,
  Clock,
  Ghost,
  Users,
  X,
  Send,
} from "lucide-react";

export function CreatePost() {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [isTimeLocked, setIsTimeLocked] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { user } = useAuthStore();

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }

    setIsPosting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content,
        media_urls: mediaFiles.length > 0 ? mediaFiles : null,
        post_type: mediaFiles.length > 0 ? "image" : "text",
        is_time_locked: isTimeLocked,
        is_ghost: isGhost,
      });

      if (error) throw error;

      toast.success("Posted successfully!");
      setContent("");
      setMediaFiles([]);
      setIsTimeLocked(false);
      setIsGhost(false);
      setIsExpanded(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Failed to upload image");
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(filePath);

      setMediaFiles((prev) => [...prev, publicUrl]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-elevated p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user?.display_name?.[0] || user?.username?.[0] || "U"}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's on your mind?"
            className="w-full resize-none border-0 bg-transparent text-navy-900 placeholder:text-navy-400 focus:ring-0 text-base min-h-[40px]"
            rows={isExpanded ? 3 : 1}
          />

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {mediaFiles.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt="Upload preview"
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setMediaFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isExpanded && (
            <>
              {/* Options */}
              <div className="flex flex-wrap gap-2 mt-3">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 hover:bg-navy-100 rounded-full text-xs font-medium text-navy-600 cursor-pointer transition-colors">
                  <Image className="w-3.5 h-3.5" />
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 hover:bg-navy-100 rounded-full text-xs font-medium text-navy-600 cursor-pointer transition-colors">
                  <Video className="w-3.5 h-3.5" />
                  Video
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setIsTimeLocked(!isTimeLocked)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isTimeLocked
                      ? "bg-gold-100 text-gold-700"
                      : "bg-navy-50 hover:bg-navy-100 text-navy-600"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Time Lock
                </button>

                <button
                  onClick={() => setIsGhost(!isGhost)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isGhost
                      ? "bg-purple-100 text-purple-700"
                      : "bg-navy-50 hover:bg-navy-100 text-navy-600"
                  }`}
                >
                  <Ghost className="w-3.5 h-3.5" />
                  Ghost Mode
                </button>

                <button
                  onClick={() => setIsCollaborative(!isCollaborative)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isCollaborative
                      ? "bg-blue-100 text-blue-700"
                      : "bg-navy-50 hover:bg-navy-100 text-navy-600"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Collab
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 hover:bg-navy-100 rounded-full text-xs font-medium text-navy-600 transition-colors">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Poll
                </button>
              </div>

              {/* Time Lock Settings */}
              {isTimeLocked && (
                <div className="mt-3 p-3 bg-gold-50 rounded-xl border border-gold-200">
                  <p className="text-xs text-gold-700 font-medium mb-2">
                    This post will be locked for Premium subscribers for 24 hours
                  </p>
                </div>
              )}

              {/* Ghost Mode Info */}
              {isGhost && (
                <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs text-purple-700 font-medium">
                    Your identity will be hidden until this post reaches 100K views
                  </p>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-navy-100">
                <div className="text-xs text-navy-400">
                  {content.length}/280 characters
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setContent("");
                      setMediaFiles([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-navy-500 hover:text-navy-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={isPosting || (!content.trim() && mediaFiles.length === 0)}
                    className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full text-sm font-semibold transition-all"
                  >
                    {isPosting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Post <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
