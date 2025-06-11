import React from 'react';

type DropdownProps = {
    label: string;
    value: number | string;
    options: string[];
    onChange: (value: number) => void;
    disabled?: boolean;
    style?: React.CSSProperties;
};

const Dropdown: React.FC<DropdownProps> = ({
                                               label,
                                               value,
                                               options,
                                               onChange,
                                               disabled = false,
                                               style = {},
                                           }) => (
    <label style={style}>
        {label}&nbsp;
        <select
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            disabled={disabled}
        >
            {options.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
        </select>
    </label>
);

export default Dropdown;