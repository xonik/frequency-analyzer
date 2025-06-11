import { useState, useEffect } from "react";

function usePersistedState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            try {
                return JSON.parse(stored);
            } catch {
                return initialValue;
            }
        }
        return initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
}

export default usePersistedState;