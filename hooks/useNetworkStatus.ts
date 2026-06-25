import * as Network from "expo-network";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const check = async () => {
            const state = await Network.getNetworkStateAsync();

            setIsOnline(
                state.isConnected === true &&
                state.isInternetReachable !== false
            );
        };

        check();

        timer = setInterval(check, 3000) as any;

        return () => clearInterval(timer);
    }, []);

    return isOnline;
}