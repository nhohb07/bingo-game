export function acknowledge(callback, payload) {
  if (typeof callback === "function") callback(payload);
}

export function sendError(socket, callback, message, code = "BAD_REQUEST") {
  const payload = { ok: false, code, message };
  if (typeof callback === "function") {
    callback(payload);
    return;
  }
  socket.emit("error", payload);
}
