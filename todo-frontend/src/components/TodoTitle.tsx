import Typography from "@mui/material/Typography";
import styled from "@emotion/styled";

const TodoTitle = styled(Typography, {
    shouldForwardProp: (p) => p !== "completed",
})<{ completed?: boolean }>`
    flex: 1;
    font-size: 13px;
    letter-spacing: 0.02em;
    line-height: 1.5;
    word-break: break-word;
    color: ${({ completed }) => (completed ? "#94a3b8" : "#0f172a")};
    text-decoration: ${({ completed }) => (completed ? "line-through" : "none")};
    text-decoration-color: #cbd5e1;
    transition: color 180ms ease;
`;

export default TodoTitle;