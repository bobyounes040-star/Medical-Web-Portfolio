// Round DOWN to nearest 30-minute slot (simple + predictable)
exports.to30MinSlot = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const minutes = d.getMinutes();
  const rounded = minutes < 30 ? 0 : 30;

  d.setMinutes(rounded, 0, 0); // set seconds/ms to 0 too
  return d;
};
