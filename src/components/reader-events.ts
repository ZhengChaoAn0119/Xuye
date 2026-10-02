/** The chapter currently under the reader's eye; changes as auto-loaded chapters scroll by. */
export type ActiveChapter = {
  id: number;
  position: number;
  title: string;
  prev: number | null;
  next: number | null;
  bookmarked: boolean;
};

/** Dispatched on window with an ActiveChapter detail when the visible chapter changes. */
export const READER_CHAPTER_EVENT = "xuye:reader-chapter";

export function announceActiveChapter(chapter: ActiveChapter) {
  window.dispatchEvent(new CustomEvent(READER_CHAPTER_EVENT, { detail: chapter }));
}
