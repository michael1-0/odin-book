import { Search, X } from "lucide-react";

type FriendsSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

function FriendsSearch({ value, onChange }: FriendsSearchProps) {
  return (
    <div className="relative mt-4">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by username"
        aria-label="Search by username"
        className="w-full rounded-sm bg-neutral-100 px-10 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-black"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default FriendsSearch;
