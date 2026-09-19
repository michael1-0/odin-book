type AvatarProps = {
  user: { username: string; profileUrl: string | null };
  className?: string;
};

function Avatar({ user, className = "h-10 w-10" }: AvatarProps) {
  return (
    <img
      src={user.profileUrl ?? undefined}
      alt={`${user.username} profile image`}
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  );
}

export default Avatar;
