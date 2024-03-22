export const debug = (message: string) => {
  if (import.meta.env.VITE_DEBUG === "on") {
    console.debug("DEBUG: " + message);
  }
};
