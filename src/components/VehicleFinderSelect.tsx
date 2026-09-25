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
    <label className={`group relative flex min-h-[76px] items-center rounded-2xl border bg-white px-4 transition-all duration-200 sm:px-5 ${disabled ? "border-zinc-200 opacity-60" : value ? "border-black shadow-[0_7px_0_#111]" : "border-zinc-300 shadow-[0_5px_0_rgba(0,0,0,.12)] hover:-translate-y-0.5 hover:border-black"}`}>
      <span className={`mr-4 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black transition-colors sm:mr-5 ${value ? "bg-[#ffc400] text-black" : disabled ? "bg-zinc-100 text-zinc-400" : "bg-black text-white"}`}>
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-black uppercase tracking-[.12em] ${value ? "text-zinc-500" : "text-zinc-400"}`}>{label}</span>
        <select
          aria-label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          className="mt-0.5 h-7 w-full appearance-none bg-transparent pr-8 text-base font-black text-black outline-none disabled:cursor-not-allowed disabled:text-zinc-400 sm:text-lg"
        >
          <option value="">{label}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </span>
      <span aria-hidden="true" className={`pointer-events-none ml-3 grid h-8 w-8 place-items-center rounded-full text-sm font-black ${value ? "bg-black text-[#ffc400]" : "bg-zinc-100 text-zinc-500"}`}>{value ? "✓" : "⌄"}</span>
    </label>
  );
}
