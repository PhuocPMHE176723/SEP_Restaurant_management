"use client";

import { useRef } from "react";

type Props = {
    value: string[];
    onChange: (value: string[]) => void;
};

export default function OtpInput({ value, onChange }: Props) {
    const refs = useRef<Array<HTMLInputElement | null>>([]);

    const handleChange = (index: number, inputValue: string) => {
        const digit = inputValue.replace(/\D/g, "").slice(-1);
        const next = [...value];
        next[index] = digit;
        onChange(next);

        if (digit && index < 5) {
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasted) return;

        const next = [...value];
        for (let i = 0; i < 6; i++) {
            next[i] = pasted[i] || "";
        }
        onChange(next);

        const lastIndex = Math.min(pasted.length - 1, 5);
        if (lastIndex >= 0) refs.current[lastIndex]?.focus();
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "nowrap",
                width: "100%",
            }}
        >
            {value.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        refs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    style={{
                        width: 54,
                        minWidth: 54,
                        height: 66,
                        flex: "0 0 54px",
                        padding: 0,
                        textAlign: "center",
                        fontSize: "32px",
                        fontWeight: 700,
                        lineHeight: "66px",
                    }}
                    className="rounded-xl border border-[#dbe3f0] bg-[#ebf1ff] outline-none transition focus:bg-[#e2eaff] focus:ring-2 focus:ring-orange-300"
                />
            ))}
        </div>
    );
}