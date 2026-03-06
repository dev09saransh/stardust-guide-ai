import React from 'react';

export const InputField = ({ label, helperText, error, ...props }) => (
    <div className="space-y-1.5 w-full">
        {label && <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">{label}</label>}
        <input
            {...props}
            className={`input-field ${error ? 'border-red-500 focus:ring-red-500/10' : ''}`}
        />
        {helperText && <p className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1 opacity-70">{helperText}</p>}
        {error && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{error}</p>}
    </div>
);

export const MaskedInput = ({ label, helperText, value, onChange, ...props }) => {
    const handleChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        onChange(val);
    };

    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">{label}</label>}
            <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-600 font-mono text-lg tracking-widest select-none pt-0.5 opacity-50">• • • •</span>
                <input
                    {...props}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    maxLength={4}
                    placeholder="1234"
                    className="input-field pl-20 font-mono text-lg tracking-[0.2em] focus:bg-white/[0.12]"
                />
            </div>
            {helperText && <p className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1 opacity-70">{helperText}</p>}
        </div>
    );
};

export const DropdownSelector = ({ label, options, helperText, ...props }) => (
    <div className="space-y-1.5 w-full">
        {label && <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">{label}</label>}
        <div className="relative">
            <select
                {...props}
                className="input-field appearance-none bg-no-repeat pr-10 cursor-pointer"
            >
                <option value="" disabled className="bg-[var(--surface)]">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value || opt} value={opt.value || opt} className="bg-[var(--surface)] text-white">
                        {opt.label || opt}
                    </option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
        {helperText && <p className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1 opacity-70">{helperText}</p>}
    </div>
);
