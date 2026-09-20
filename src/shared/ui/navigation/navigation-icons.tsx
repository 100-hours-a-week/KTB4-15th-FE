import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

type NavigationIconProps = IconProps & {
  children: ReactNode;
  viewBox?: string;
};

function NavigationIcon({
  children,
  className,
  viewBox = "0 0 24 24",
}: NavigationIconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox={viewBox}>
      {children}
    </svg>
  );
}

export function WishlistIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className} viewBox="0 -960 960 960">
      <path
        d="m480-146.93-44.15-39.69q-99.46-90.23-164.5-155.07-65.04-64.85-103.08-115.43-38.04-50.57-53.15-92.27Q100-591.08 100-634q0-85.15 57.42-142.58Q214.85-834 300-834q52.38 0 99 24.5t81 70.27q34.38-45.77 81-70.27 46.62-24.5 99-24.5 85.15 0 142.58 57.42Q860-719.15 860-634q0 42.92-15.12 84.61-15.11 41.7-53.15 92.27-38.04 50.58-102.89 115.43Q624-276.85 524.15-186.62L480-146.93Zm0-81.07q96-86.38 158-148.08 62-61.69 98-107.19t50-80.81q14-35.3 14-69.92 0-60-40-100t-100-40q-47.38 0-87.58 26.88-40.19 26.89-63.65 74.81h-57.54q-23.85-48.31-63.85-75Q347.38-774 300-774q-59.62 0-99.81 40Q160-694 160-634q0 34.62 14 69.92 14 35.31 50 80.81t98 107q62 61.5 158 148.27Zm0-273Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}

export function WishlistActiveIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className} viewBox="0 -960 960 960">
      <path
        d="m480-146.93-44.15-39.69q-99.46-90.23-164.5-155.07-65.04-64.85-103.08-115.43-38.04-50.57-53.15-92.27Q100-591.08 100-634q0-85.15 57.42-142.58Q214.85-834 300-834q52.38 0 99 24.5t81 70.27q34.38-45.77 81-70.27 46.62-24.5 99-24.5 85.15 0 142.58 57.42Q860-719.15 860-634q0 42.92-15.12 84.61-15.11 41.7-53.15 92.27-38.04 50.58-102.89 115.43Q624-276.85 524.15-186.62L480-146.93Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}

export function FittingIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className}>
      <path
        d="M6.5 6.5 7.7 10.3 11.5 11.5 7.7 12.7 6.5 16.5 5.3 12.7 1.5 11.5 5.3 10.3 6.5 6.5ZM16.5 1.5l.85 2.65L20 5l-2.65.85L16.5 8.5l-.85-2.65L13 5l2.65-.85L16.5 1.5ZM15 13l.7 2.3L18 16l-2.3.7L15 19l-.7-2.3L12 16l2.3-.7L15 13Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}

export function FittingActiveIcon({ className }: IconProps) {
  return <FittingIcon className={className} />;
}

export function ChatIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4.25a2.5 2.5 0 0 1-2-2.45v-7.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8 9.5h.01M12 9.5h.01M16 9.5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </NavigationIcon>
  );
}

export function ChatActiveIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4.25a2.5 2.5 0 0 1-2-2.45v-7.8Z"
        fill="currentColor"
      />
      <path
        d="M8 9.5h.01M12 9.5h.01M16 9.5h.01"
        stroke="var(--color-text-primary)"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </NavigationIcon>
  );
}

export function RankingIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className} viewBox="0 -960 960 960">
      <path
        d="M216.54-180v-60h526.92v60H216.54Zm-1.15-127.69L160.92-621q-2 .38-4.5.69-2.5.31-4.5.31Q130-620 115-635.14q-15-15.15-15-36.78 0-21.96 15-37.33 15-15.36 36.95-15.36 21.94 0 37.3 15.36 15.37 15.37 15.37 37.33 0 5.58-.93 10.37-.92 4.78-2.92 9.01l126.54 53.69 121.92-166.38q-9.84-6.85-15.88-18.02-6.04-11.17-6.04-24.06 0-21.95 15.36-37.32Q458.03-860 479.98-860q21.94 0 37.33 15.35 15.38 15.34 15.38 37.27 0 13.15-6.04 24.23-6.04 11.07-15.88 17.92l121.92 166.38 126.54-53.69q-1.54-4.09-2.69-9.01-1.16-4.91-1.16-10.37 0-21.96 15-37.33 15-15.36 36.95-15.36 21.94 0 37.31 15.36Q860-693.88 860-671.92q0 21.57-15.39 36.75Q829.22-620 807.23-620q-1.76 0-3.96-.5-2.19-.5-4.32-.5l-54.34 313.31H215.39Zm51.07-60h427.08l37.54-206.24-118.85 49.47L480-705.92 347.77-524.46l-118.85-49.47 37.54 206.24Zm213.54 0Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}

export function RankingActiveIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className} viewBox="0 -960 960 960">
      <path
        d="M216.54-180v-60h526.92v60H216.54Zm-1.15-127.69L160.92-621q-2 .38-4.5.69-2.5.31-4.5.31Q130-620 115-635.14q-15-15.15-15-36.78 0-21.96 15-37.33 15-15.36 36.95-15.36 21.94 0 37.3 15.36 15.37 15.37 15.37 37.33 0 5.58-.93 10.37-.92 4.78-2.92 9.01l126.54 53.69 121.92-166.38q-9.84-6.85-15.88-18.02-6.04-11.17-6.04-24.06 0-21.95 15.36-37.32Q458.03-860 479.98-860q21.94 0 37.33 15.35 15.38 15.34 15.38 37.27 0 13.15-6.04 24.23-6.04 11.07-15.88 17.92l121.92 166.38 126.54-53.69q-1.54-4.09-2.69-9.01-1.16-4.91-1.16-10.37 0-21.96 15-37.33 15-15.36 36.95-15.36 21.94 0 37.31 15.36Q860-693.88 860-671.92q0 21.57-15.39 36.75Q829.22-620 807.23-620q-1.76 0-3.96-.5-2.19-.5-4.32-.5l-54.34 313.31H215.39Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}

export function MyPageIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className} viewBox="0 -960 960 960">
      <path
        d="M381.04-533.35Q340-574.38 340-632.31q0-57.92 41.04-98.96 41.04-41.04 98.96-41.04 57.92 0 98.96 41.04Q620-690.23 620-632.31q0 57.93-41.04 98.96-41.04 41.04-98.96 41.04-57.92 0-98.96-41.04ZM180-187.69v-88.93q0-29.38 15.96-54.42 15.96-25.04 42.66-38.5 59.3-29.07 119.65-43.61 60.35-14.54 121.73-14.54t121.73 14.54q60.35 14.54 119.65 43.61 26.7 13.46 42.66 38.5Q780-306 780-276.62v88.93H180Zm60-60h480v-28.93q0-12.15-7.04-22.5-7.04-10.34-19.11-16.88-51.7-25.46-105.42-38.58Q534.7-367.69 480-367.69q-54.7 0-108.43 13.11-53.72 13.12-105.42 38.58-12.07 6.54-19.11 16.88-7.04 10.35-7.04 22.5v28.93Zm296.5-328.12q23.5-23.5 23.5-56.5t-23.5-56.5q-23.5-23.5-56.5-23.5t-56.5 23.5q-23.5 23.5-23.5 56.5t23.5 56.5q23.5 23.5 56.5 23.5t56.5-23.5Zm-56.5-56.5Zm0 384.62Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}

export function MyPageActiveIcon({ className }: IconProps) {
  return (
    <NavigationIcon className={className} viewBox="0 -960 960 960">
      <path
        d="M381.04-533.35Q340-574.38 340-632.31q0-57.92 41.04-98.96 41.04-41.04 98.96-41.04 57.92 0 98.96 41.04Q620-690.23 620-632.31q0 57.93-41.04 98.96-41.04 41.04-98.96 41.04-57.92 0-98.96-41.04ZM180-187.69v-88.93q0-29.38 15.96-54.42 15.96-25.04 42.66-38.5 59.3-29.07 119.65-43.61 60.35-14.54 121.73-14.54t121.73 14.54q60.35 14.54 119.65 43.61 26.7 13.46 42.66 38.5Q780-306 780-276.62v88.93H180Z"
        fill="currentColor"
      />
    </NavigationIcon>
  );
}
