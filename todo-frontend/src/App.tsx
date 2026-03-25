import { useState, useEffect, useCallback, useRef } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";
import theme from "./theme.ts";
import TodoRow from "./components/TodoRow.tsx";
import TodoTitle from "./components/TodoTitle.tsx";
import SectionLabel from "./components/SectionLabel.tsx";
import DeleteBtn from "./components/DeleteBtn.tsx";

// ─── Types & helpers ──────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

interface Todo {
    todoId: string;
    title: string;
    completed: boolean;
    createdAt: string;
}

type Filter = "all" | "active" | "done";

function getUserId(): string {
    let id = localStorage.getItem("todo_user_id");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("todo_user_id", id);
    }
    return id;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-User-Id": getUserId(),
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    if (res.status === 204) return undefined as T;
    return res.json();
}

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function TodoApp() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [toggling, setToggling] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>("all");
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchTodos = useCallback(async () => {
        try {
            const data = await apiFetch<{ todos: Todo[] }>("/todos");
            setTodos(data.todos);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTodos(); }, [fetchTodos]);

    const addTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = input.trim();
        if (!title || adding) return;
        setAdding(true);
        try {
            const todo = await apiFetch<Todo>("/todos", {
                method: "POST",
                body: JSON.stringify({ title }),
            });
            setTodos(prev => [todo, ...prev]);
            setInput("");
            inputRef.current?.focus();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setAdding(false);
        }
    };

    const toggleTodo = async (todo: Todo) => {
        if (toggling.has(todo.todoId)) return;
        setToggling(prev => new Set(prev).add(todo.todoId));
        setTodos(prev => prev.map(t => t.todoId === todo.todoId ? { ...t, completed: !t.completed } : t));
        try {
            const updated = await apiFetch<Todo>(`/todos/${todo.todoId}`, {
                method: "PATCH",
                body: JSON.stringify({ completed: !todo.completed }),
            });
            setTodos(prev => prev.map(t => t.todoId === todo.todoId ? updated : t));
        } catch (e: any) {
            setTodos(prev => prev.map(t => t.todoId === todo.todoId ? todo : t));
            setError(e.message);
        } finally {
            setToggling(prev => { const s = new Set(prev); s.delete(todo.todoId); return s; });
        }
    };

    const deleteTodo = async (todoId: string) => {
        const snapshot = todos;
        setTodos(prev => prev.filter(t => t.todoId !== todoId));
        try {
            await apiFetch(`/todos/${todoId}`, { method: "DELETE" });
        } catch (e: any) {
            setTodos(snapshot);
            setError(e.message);
        }
    };

    const filtered = todos.filter(t =>
        filter === "all" ? true : filter === "active" ? !t.completed : t.completed
    );

    const total = todos.length;
    const done = todos.filter(t => t.completed).length;
    const active = total - done;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "grid",
                gridTemplateColumns: "1fr min(640px, 100%) 1fr",
                gridTemplateRows: "auto 1fr auto",
            }}
        >
            {/* ── Header ── */}
            <Box
                component="header"
                sx={{
                    gridColumn: "1 / -1",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    px: 3,
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Stack direction="row" alignItems="center" gap={2}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                        TODO
                        <Box component="span" sx={{ color: "primary.main" }}>.</Box>
                        APP
                    </Typography>
                    <Chip
                        label="aws · cdk"
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, borderColor: "divider", color: "text.secondary", fontSize: 13 }}
                    />
                </Stack>
                <Typography sx={{ fontSize: 13, color: "text.secondary", letterSpacing: "0.04em" }}>
                    uid:{getUserId().slice(0, 8)}
                </Typography>
            </Box>

            {/* ── Main ── */}
            <Box
                component="main"
                sx={{ gridColumn: 2, pt: 6, pb: 10, display: "flex", flexDirection: "column" }}
            >
                <SectionLabel sx={{ mb: 2.5 }}>new task</SectionLabel>

                {/* Input form */}
                <Box
                    component="form"
                    onSubmit={addTodo}
                    sx={{
                        display: "flex",
                        mb: 5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "2px",
                        overflow: "hidden",
                        transition: "border-color 180ms ease, box-shadow 180ms ease",
                        "&:focus-within": {
                            borderColor: "primary.main",
                            boxShadow: "0 0 0 3px rgba(37,99,235,0.12)",
                        },
                    }}
                >
                    <TextField
                        inputRef={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="_ what needs doing?"
                        autoComplete="off"
                        autoFocus
                        fullWidth
                        variant="standard"
                        slotProps={{ input: { disableUnderline: true } }}
                        sx={{
                            "& .MuiInputBase-root": {
                                px: 2,
                                py: 1.75,
                                bgcolor: "background.paper",
                                fontSize: 13,
                                letterSpacing: "0.02em",
                            },
                            "& input::placeholder": { color: "#cbd5e1", opacity: 1 },
                        }}
                    />
                    <Button
                        type="submit"
                        disabled={adding || !input.trim()}
                        sx={{
                            px: 2.5,
                            minWidth: 80,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            borderRadius: 0,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            flexShrink: 0,
                            "&:hover": { bgcolor: "#1d4ed8" },
                            "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#94a3b8" },
                        }}
                    >
                        {adding ? "···" : "+ add"}
                    </Button>
                </Box>

                {/* Error */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{
                            mb: 2.5,
                            fontSize: 12,
                            fontFamily: "'IBM Plex Mono', monospace",
                            bgcolor: "rgba(239,68,68,0.06)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            "& .MuiAlert-icon": { color: "error.main" },
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Stats */}
                {!loading && (
                    <>
                        <Stack
                            direction="row"
                            gap={4}
                            mb={3.5}
                            pb={3}
                            sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                        >
                            {[
                                { value: total, label: "total", accent: false },
                                { value: active, label: "active", accent: true },
                                { value: done, label: "done", accent: false },
                            ].map(({ value, label, accent }) => (
                                <Box key={label}>
                                    <Typography
                                        sx={{
                                            fontSize: 24,
                                            fontWeight: 600,
                                            lineHeight: 1,
                                            color: accent ? "primary.main" : "text.primary",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {value}
                                    </Typography>
                                    <Typography
                                        sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.1em", textTransform: "uppercase", mt: 0.5 }}
                                    >
                                        {label}
                                    </Typography>
                                </Box>
                            ))}
                            {total > 0 && (
                                <Box ml="auto">
                                    <Typography
                                        sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
                                    >
                                        {pct}%
                                    </Typography>
                                    <Typography
                                        sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.1em", textTransform: "uppercase", mt: 0.5 }}
                                    >
                                        complete
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        {total > 0 && (
                            <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                    mb: 3,
                                    height: 2,
                                    borderRadius: 1,
                                    bgcolor: "#e2e8f0",
                                    "& .MuiLinearProgress-bar": {
                                        bgcolor: "primary.main",
                                        transition: "transform 400ms cubic-bezier(0.4,0,0.2,1)",
                                    },
                                }}
                            />
                        )}
                    </>
                )}

                {/* Filters */}
                {!loading && total > 0 && (
                    <Stack direction="row" gap={0.5} mb={1}>
                        {(["all", "active", "done"] as Filter[]).map(f => {
                            const count = f === "all" ? total : f === "active" ? active : done;
                            const isActive = filter === f;
                            return (
                                <Chip
                                    key={f}
                                    label={`${f}${count > 0 ? ` (${count})` : ""}`}
                                    onClick={() => setFilter(f)}
                                    variant={isActive ? "filled" : "outlined"}
                                    size="small"
                                    sx={{
                                        height: 24,
                                        cursor: "pointer",
                                        borderColor: isActive ? "primary.main" : "divider",
                                        bgcolor: isActive ? "rgba(37,99,235,0.08)" : "transparent",
                                        color: isActive ? "primary.main" : "text.secondary",
                                        "&:hover": {
                                            borderColor: isActive ? "primary.main" : "#333",
                                            color: isActive ? "primary.main" : "text.primary",
                                        },
                                    }}
                                />
                            );
                        })}
                    </Stack>
                )}

                {/* Todo list / states */}
                {loading ? (
                    <Stack alignItems="center" gap={1.5} py={6}>
                        <CircularProgress size={16} thickness={2} sx={{ color: "primary.main" }} />
                        <Typography sx={{ fontSize: 11, color: "text.secondary", letterSpacing: "0.08em" }}>
                            fetching tasks…
                        </Typography>
                    </Stack>
                ) : filtered.length === 0 ? (
                    <Stack alignItems="center" py={8} gap={1}>
                        <Typography sx={{ fontSize: 22, opacity: 0.15 }}>
                            {filter === "done" ? "✓" : "□"}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", letterSpacing: "0.08em" }}>
                            {filter === "all" ? "no tasks yet" : filter === "active" ? "nothing active · all done" : "nothing completed yet"}
                        </Typography>
                        {filter === "all" && (
                            <Typography sx={{ fontSize: 10, color: "text.disabled", letterSpacing: "0.06em" }}>
                                type above to get started
                            </Typography>
                        )}
                    </Stack>
                ) : (
                    <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                        {filtered.map(todo => (
                            <TodoRow key={todo.todoId} component="li" completed={todo.completed}>
                                <Checkbox
                                    checked={todo.completed}
                                    onChange={() => toggleTodo(todo)}
                                    disabled={toggling.has(todo.todoId)}
                                    size="small"
                                    sx={{
                                        p: 0,
                                        color: "#cbd5e1",
                                        "&.Mui-checked": { color: "primary.main" },
                                        "&:hover": { color: "primary.main" },
                                        "& .MuiSvgIcon-root": { fontSize: 16 },
                                    }}
                                />
                                <TodoTitle completed={todo.completed}>{todo.title}</TodoTitle>
                                <Typography sx={{ fontSize: 10, color: "text.disabled", letterSpacing: "0.04em", flexShrink: 0 }}>
                                    {formatRelative(todo.createdAt)}
                                </Typography>
                                <Tooltip title="delete" placement="left" arrow>
                                    <DeleteBtn
                                        size="medium"
                                        onClick={() => deleteTodo(todo.todoId)}
                                        aria-label="delete task"
                                    >
                                        ✕
                                    </DeleteBtn>
                                </Tooltip>
                            </TodoRow>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <TodoApp />
        </ThemeProvider>
    );
}