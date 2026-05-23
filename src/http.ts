import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const http = axios.create({
  headers: {
    "User-Agent": USER_AGENT,
  },
  timeout: 120_000,
});
