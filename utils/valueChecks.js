const isValidString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isNaturalNumber = (value) => {
  return typeof value === 'number' && value >= 0 && value % 1 === 0;
};

const isUUID = (value) => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
};

const isValidUrl = (value) => {
  const urlPattern = /^(https?:\/\/)([\w-]+(\.[\w-]+)+)(:\d+)?(\/[^\s]*)?$/;
  return urlPattern.test(value);
};

function isValidDateString (value) {
  return typeof value === 'string' && !isNaN(new Date(value).getTime());
}

module.exports = { isValidString, isNaturalNumber, isUUID, isValidUrl, isValidDateString };
