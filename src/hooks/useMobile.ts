import { useState, useEffect } from 'react';

export const useMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [touchPoints, setTouchPoints] = useState(0);

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Refined breakpoints for luxury devices
            setIsMobile(width < 768 || (width < 1024 && height < 500)); // Include small landscape phones
            setIsTablet(width >= 768 && width < 1024 && height >= 500);
            setIsLandscape(width > height);
            setTouchPoints(navigator.maxTouchPoints || 0);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        window.addEventListener('orientationchange', checkDevice);
        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, []);

    return {
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        isLandscape,
        isTouch: touchPoints > 0
    };
};
