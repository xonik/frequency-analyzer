import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SampleFileLinesProvider } from "./context/SampleFileLinesContext";
import { AnalyzedFileLinesProvider } from "./context/AnalyzedFileLinesContext";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <SampleFileLinesProvider>
            <AnalyzedFileLinesProvider>
                <App/>
            </AnalyzedFileLinesProvider>
        </SampleFileLinesProvider>
    </React.StrictMode>
);
