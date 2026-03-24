import styled from "@emotion/styled";
import IconButton from "@mui/material/IconButton";

const DeleteBtn = styled(IconButton)`
    opacity: 0;
    color: #cbd5e1;
    font-size: 11px;
    padding: 4px;
    transition: opacity 150ms ease, color 150ms ease, background 150ms ease;

    &:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
    }
`;

export default DeleteBtn;