import React, { createContext, useState, ReactNode } from 'react';

export const SampleFileLinesContext = createContext<{
    lines: string[];
    setLines: (lines: string[]) => void;
}>({
    lines: [],
    setLines: () => {},
});

export const SampleFileLinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lines, setLines] = useState<string[]>([]);
    return (
        <SampleFileLinesContext.Provider value={{ lines, setLines }}>
            {children}
        </SampleFileLinesContext.Provider>
    );
};