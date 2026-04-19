"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import clsx from "clsx";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import styles from "./GooeySearchBar.module.css";

export type SearchableItem = {
  id: string;
  label: string;
  meta?: string;
};

interface GooeySearchBarProps<T extends SearchableItem> {
  items: T[];
  onSelect: (item: T) => void;
  placeholder?: string;
  maxResults?: number;
  collapsedLabel?: string;
  className?: string;
}

/** Static search glyph shown when the bar is collapsed. */
function CollapsedSearchGlyph() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 15 15"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SearchIcon({ isUnsupported }: { isUnsupported: boolean }) {
  return (
    <motion.svg
      initial={{
        opacity: 0,
        scale: 0.8,
        x: -4,
        filter: isUnsupported ? "none" : "blur(5px)",
      }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        scale: 0.8,
        x: -4,
        filter: isUnsupported ? "none" : "blur(5px)",
      }}
      transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.15 }}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </motion.svg>
  );
}

function LoadingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="Loading"
      role="status"
    >
      <rect width="256" height="256" fill="none" />
      <line
        x1="128"
        y1="32"
        x2="128"
        y2="64"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="195.88"
        y1="60.12"
        x2="173.25"
        y2="82.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="224"
        y1="128"
        x2="192"
        y2="128"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="195.88"
        y1="195.88"
        x2="173.25"
        y2="173.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="128"
        y1="224"
        x2="128"
        y2="192"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="60.12"
        y1="195.88"
        x2="82.75"
        y2="173.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="32"
        y1="128"
        x2="64"
        y2="128"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="60.12"
        y1="60.12"
        x2="82.75"
        y2="82.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

function InfoIcon({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.12 + 0.3 }}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20.2832 19.9316"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.91420 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.91420 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22384 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </motion.svg>
  );
}

// Keep the pill horizontally centered in its wrapper at all times —
// step2 only grows the width, no translation, so the search glyph stays
// exactly at center as the box expands.
const buttonVariants: Variants = {
  initial: { width: 56 },
  step1: { width: 56 },
  step2: { width: 360 },
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1 },
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/** Safari + Chrome-on-iOS don't always render SVG goo filters cleanly, so we
 * bail out of the filter in those environments rather than ship a broken
 * blobby look. */
function isUnsupportedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");
  const isChromeOniOS = ua.includes("crios");
  return isSafari || isChromeOniOS;
}

const getResultItemVariants = (
  index: number,
  isUnsupported: boolean,
): Variants => ({
  initial: {
    y: 0,
    scale: 0.3,
    filter: isUnsupported ? "none" : "blur(10px)",
  },
  animate: {
    y: (index + 1) * 50,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    y: isUnsupported ? 0 : -4,
    scale: 0.8,
  },
});

const getResultItemTransition = (index: number) => ({
  duration: 0.6,
  delay: index * 0.08,
  type: "spring" as const,
  bounce: 0.3,
  exit: { duration: index * 0.08 },
  filter: { ease: "easeInOut" as const },
});

export function GooeySearchBar<T extends SearchableItem>({
  items,
  onSelect,
  placeholder = "Search…",
  maxResults = 6,
  collapsedLabel,
  className,
}: GooeySearchBarProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState<T[]>([]);

  const debounced = useDebounce(searchText, 250);
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  // Expand → focus the input. Collapse → clear state.
  useEffect(() => {
    if (step === 2) {
      inputRef.current?.focus();
    } else {
      setSearchText("");
      setSearchData([]);
      setIsLoading(false);
    }
  }, [step]);

  // Filter against the provided items whenever the debounced text changes.
  useEffect(() => {
    let cancelled = false;
    const query = debounced.trim().toLowerCase();
    if (!query) {
      setSearchData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Yield to the event loop so the loading spinner can paint on slow boxes.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const hits = items
        .filter((i) => i.label.toLowerCase().includes(query))
        .slice(0, maxResults);
      setSearchData(hits as T[]);
      setIsLoading(false);
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [debounced, items, maxResults]);

  // Collapse on click-outside / Escape. We attach in the CAPTURE phase so
  // nested components (deck.gl's canvas, three.js canvases, etc.) can't
  // swallow the event with stopPropagation before we see it.
  useEffect(() => {
    if (step !== 2) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const w = wrapperRef.current;
      if (!w) return;
      if (!w.contains(e.target as Node)) setStep(1);
    };
    window.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      window.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [step]);

  const handleButtonClick = () => {
    if (step === 1) setStep(2);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setStep(1);
      return;
    }
    if (e.key === "Enter" && searchData.length > 0) {
      e.preventDefault();
      const first = searchData[0];
      onSelect(first);
      setStep(1);
    }
  };

  const pick = (item: T) => {
    onSelect(item);
    setStep(1);
  };

  return (
    <div
      ref={wrapperRef}
      className={clsx(styles.wrapper, className)}
    >
      <div className={styles.buttonContent}>
        <motion.div
          className={styles.buttonContentInner}
          variants={buttonVariants}
          initial="initial"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.65, type: "spring", bounce: 0.2 }}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key="results"
              className={styles.searchResults}
              role="listbox"
              aria-label="Building search results"
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                delay: isUnsupported ? 0.3 : 1.0,
                duration: 0.4,
              }}
            >
              <AnimatePresence mode="popLayout">
                {searchData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    variants={getResultItemVariants(index, isUnsupported)}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={getResultItemTransition(index)}
                    className={styles.searchResult}
                    role="option"
                    aria-selected="false"
                    onClick={() => pick(item)}
                  >
                    <div className={styles.searchResultTitle}>
                      <InfoIcon index={index} className={styles.infoIcon} />
                      <motion.span
                        className={styles.searchResultLabel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    </div>
                    {item.meta && (
                      <motion.span
                        className={styles.searchResultMeta}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.25 }}
                      >
                        {item.meta}
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          <motion.div
            onClick={handleButtonClick}
            whileHover={{ scale: step === 2 ? 1 : 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={styles.searchBtn}
            role="button"
            aria-label={step === 1 ? "Open search" : undefined}
          >
            {step === 1 ? (
              <span className={styles.searchGlyph}>
                <CollapsedSearchGlyph />
                {collapsedLabel ? (
                  <span className={styles.searchGlyphLabel}>
                    {collapsedLabel}
                  </span>
                ) : null}
              </span>
            ) : (
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder={placeholder}
                aria-label="Search input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="icon"
                className={styles.separateElement}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{
                  delay: 0.1,
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.15,
                }}
              >
                {!isLoading ? (
                  <SearchIcon isUnsupported={isUnsupported} />
                ) : (
                  <LoadingIcon className={styles.loadingIcon} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {step === 2 &&
          !isLoading &&
          debounced.trim() &&
          searchData.length === 0 && (
            <span className={styles.emptyHint}>No building matches.</span>
          )}
      </div>
    </div>
  );
}

export default GooeySearchBar;
