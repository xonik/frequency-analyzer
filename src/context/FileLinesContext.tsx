import React, { createContext, useState, ReactNode } from 'react';

export const FileLinesContext = createContext<{
    lines: string[];
    setLines: (lines: string[]) => void;
}>({
    lines: [],
    setLines: () => {},
});

export const FileLinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lines, setLines] = useState<string[]>([]);
    return (
        <FileLinesContext.Provider value={{ lines, setLines }}>
            {children}
        </FileLinesContext.Provider>
    );
};