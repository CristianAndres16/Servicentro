import {
    useState,
    useEffect
} from "react";


function ConnectionStatus() {

    const [
        isOnline,
        setIsOnline
    ] = useState(
        navigator.onLine
    );


    useEffect(() => {

        function handleOnline() {
            setIsOnline(true);
        }


        function handleOffline() {
            setIsOnline(false);
        }


        window.addEventListener(
            "online",
            handleOnline
        );


        window.addEventListener(
            "offline",
            handleOffline
        );


        return () => {

            window.removeEventListener(
                "online",
                handleOnline
            );


            window.removeEventListener(
                "offline",
                handleOffline
            );

        };

    }, []);


    return (
        <div className="connection-status">

            <span
                className={
                    isOnline
                        ? "status-dot online"
                        : "status-dot offline"
                }
            >
            </span>

            {
                isOnline
                    ? "Con conexión"
                    : "Sin conexión"
            }

        </div>
    );

}


export default ConnectionStatus;