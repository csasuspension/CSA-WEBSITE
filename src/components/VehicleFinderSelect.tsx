type Props = {
  number: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  disabled?: boolean;
};

export function VehicleFinderSelect({ number, label, value, setValue, options, disabled }: Props) {
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
        disabled={disabled}
        className="h-14 w-full bg-transparent text-[15px] font-bold outline-none disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        <option value="">{label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
