import { useEffect, useState } from "react";

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <span className={`connection-status ${isOnline ? "is-online" : "is-offline"}`}>
      <span className="connection-dot" aria-hidden="true" />
      {isOnline ? "Con conexión" : "Sin conexión"}
    </span>
  );
}

export default ConnectionStatus;
