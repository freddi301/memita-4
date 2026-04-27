const data = {};
module.exports = {
  async getItem(key) {
    return data[key] || null;
  },
  async setItem(key, value) {
    data[key] = value;
  },
};
