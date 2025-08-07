import React, { createContext, useState, ReactNode } from 'react';

export const AnalyzedFileLinesContext = createContext<{
    lines: string[];
    setLines: (lines: string[]) => void;
}>({
    lines: [],
    setLines: () => {},
});

export const AnalyzedFileLinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lines, setLines] = useState<string[]>([]);
    return (
        <AnalyzedFileLinesContext.Provider value={{ lines, setLines }}>
            {children}
        </AnalyzedFileLinesContext.Provider>
    );
};