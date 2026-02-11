import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";

export const useWarmUpBrowser = () => {
    useEffect(() => {
        // Preloads the browser on Android to reduce lag when opening the OAuth flow
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};