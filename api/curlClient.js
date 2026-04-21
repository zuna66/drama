/**
 * curlClient.js — axios drop-in replacement for Vercel compatibility.
 * The original used the `curl` binary via execFile which is unavailable
 * in Vercel's serverless runtime. This version uses axios instead.
 */
import axios from 'axios';

export const curlClient = {
  async request(cfg) {
    return axios.request(cfg);
  },
  async get(url, cfg = {}) {
    return axios.get(url, cfg);
  },
  async post(url, data, cfg = {}) {
    return axios.post(url, data, cfg);
  },
  async put(url, data, cfg = {}) {
    return axios.put(url, data, cfg);
  },
  async delete(url, cfg = {}) {
    return axios.delete(url, cfg);
  },
};

export default curlClient;
