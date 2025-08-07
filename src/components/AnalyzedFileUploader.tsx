import React, { useContext } from 'react';
import { AnalyzedFileLinesContext } from "../context/AnalyzedFileLinesContext";

const AnalyzedFileUploader: React.FC = () => {
    const { setLines } = useContext(AnalyzedFileLinesContext);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/);
            setLines(lines.filter(line => line.trim() !== "")); // Filter out empty lines
        };
        reader.readAsText(file);
    };

    return (
        <div>
            Analyzed file: <input type="file" accept="*" onChange={handleFileChange} />
        </div>
    );
};

export default AnalyzedFileUploader;