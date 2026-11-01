function StatusMessage({ type = "info", message }) {
  if (!message) return null;

  return (
    <p className={`status-message status-message-${type}`} role={type === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
}

export default StatusMessage;
