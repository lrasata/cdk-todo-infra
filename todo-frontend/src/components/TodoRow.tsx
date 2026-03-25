import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import { keyframes } from "@emotion/react";

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to   { opacity: 1; transform: translateY(0); }
`;

type TodoRowProps = BoxProps & { completed?: boolean };

const TodoRow = styled(({ completed: _completed, ...rest }: TodoRowProps) => <Box {...rest} />, {
    shouldForwardProp: (p) => p !== "completed",
})<TodoRowProps>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
    animation: ${slideIn} 200ms ease;
    transition: background 150ms ease, padding 150ms ease, margin 150ms ease;

    &:first-of-type {
        border-top: 1px solid #e2e8f0;
    }

    &:hover {
        background: rgba(37, 99, 235, 0.04);
        margin: 0 -12px;
        padding-left: 12px;
        padding-right: 12px;
    }

    &:hover button {
        opacity: 1;
    }
`;

export default TodoRow;