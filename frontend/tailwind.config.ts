import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: {50:'#f5f4ee',100:'#eeeee5',200:'#dedfd5',300:'#c5cfc7',400:'#71867e',500:'#526d64',600:'#3e5e54',700:'#2e4c44',800:'#213f37',900:'#173c34',950:'#102c26'},
        purple: {50:'#edf5f1',100:'#dceee6',200:'#b9dbcb',300:'#85b9a4',400:'#509980',500:'#2d806a',600:'#206b59',700:'#185445',800:'#15473b',900:'#123d32',950:'#102e27'},
        indigo: {50:'#edf5f4',100:'#d7ece8',200:'#b7d8d0',300:'#86b9ae',400:'#579b8d',500:'#378374',600:'#286b5e',700:'#20554b',800:'#1b463e',900:'#173c34',950:'#102c26'},
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
