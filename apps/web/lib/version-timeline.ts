export function getTimelineStatusLabel(status: string) {
  return status === 'published' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1);
}
