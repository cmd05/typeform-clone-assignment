export function UserAvatar({ initial }: { initial: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-app-avatar text-sm font-semibold text-app-text">
      {initial}
    </div>
  );
}
