type Props = {
  number: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
};

export function VehicleFinderSelect({ number, label, value, setValue, options }: Props) {
  return (
    <label className="flex items-center rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
      <span className="mr-4 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-200 text-sm font-black text-zinc-600">
        {number}
      </span>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-20 w-full bg-transparent text-base font-bold outline-none"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
