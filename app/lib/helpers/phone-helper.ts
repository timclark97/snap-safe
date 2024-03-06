export const normalizePhone = (unformatted: string) => {
  const magicMoonRunes = /^\+\d{10}$/;
  const idealLen = 12;
  //do this to avoid whole execution if string is already in the right format
  if (magicMoonRunes.test(unformatted)) {
    return unformatted;
  }

  const phoneStr = unformatted.split("");

  const onlyAcceptable = phoneStr.filter(
    (v) => parseInt(v) || v === "0" || v === "+"
  );
  if (
    onlyAcceptable.join("").length > idealLen ||
    onlyAcceptable.join("").length < idealLen - 2
  ) {
    throw new Error("Invalid phone number");
  }
  if (onlyAcceptable.join("").includes("+1")) {
    onlyAcceptable.splice(onlyAcceptable.indexOf("+"), 2);
  }

  return `+1${onlyAcceptable.join("")}`;
};
