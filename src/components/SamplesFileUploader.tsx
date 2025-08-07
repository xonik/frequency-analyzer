import React, { useContext } from 'react';
import { SampleFileLinesContext } from "../context/SampleFileLinesContext";

const SamplesFileUploader: React.FC = () => {
    const { setLines } = useContext(SampleFileLinesContext);

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
            Samples file: <input type="file" accept="*" onChange={handleFileChange} />
        </div>
    );
};

export default SamplesFileUploader;