let isContinuous = false;

function toggleContinuous() {
  isContinuous = !isContinuous;
}

function getContinuousStatus() {
  return isContinuous;
}

module.exports = {
  toggleContinuous,
  getContinuousStatus
};
