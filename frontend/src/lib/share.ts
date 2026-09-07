import { toast } from "sonner";

interface ShareParams {
  id: string;
  title: string;
  venue_name: string;
}

export async function shareEvent(event: ShareParams) {
  // Public standalone page URL
  const shareUrl = `${window.location.origin}/events/${event.id}`;
  const shareText = `Check out "${event.title}" at ${event.venue_name} on EventDek! 🎟️`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: event.title,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (err: any) {
      if (err.name === "AbortError") return;
    }
  }

  // Fallback for desktop browsers
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Event link copied to clipboard!");
  } catch {
    toast.error("Failed to copy link.");
  }
}
