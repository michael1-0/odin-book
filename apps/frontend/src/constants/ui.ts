// Distance from the viewport edge at which the "load more" sentinel
// starts fetching the next page before it scrolls into view.
export const LOAD_MORE_ROOT_MARGIN = "200px";

export const FRIEND_SEARCH_DEBOUNCE_MS = 300;

// Messages from the same sender within this window are grouped.
export const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

// Cloudinary transform widths (`getOptimizedImageUrl` uses the default).
export const IMAGE_WIDTHS = {
  large: 1200,
  medium: 900,
  small: 600,
} as const;
