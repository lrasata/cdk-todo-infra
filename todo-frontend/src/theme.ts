// ─── Theme ────────────────────────────────────────────────────────────────────

import {createTheme} from "@mui/material";

const theme = createTheme({
    palette: {
        mode: "light",
        background: { default: "#f5f7fa", paper: "#ffffff" },
        primary: { main: "#2563eb", contrastText: "#ffffff" },
        text: { primary: "#0f172a", secondary: "#64748b", disabled: "#cbd5e1" },
        divider: "#e2e8f0",
        error: { main: "#ef4444" },
    },
    typography: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 16,
    },
    shape: { borderRadius: 6 },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        ::selection { background: #2563eb; color: #ffffff; }
      `,
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    letterSpacing: "0.08em",
                    fontFamily: "'IBM Plex Mono', monospace",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    letterSpacing: "0.06em",
                },
            },
        },
    },
});

export default theme;