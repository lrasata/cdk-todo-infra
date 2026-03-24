import styled from "@emotion/styled";
import Typography from "@mui/material/Typography";

const SectionLabel = styled(Typography)`
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 12px;

    &::after {
        content: "";
        flex: 1;
        height: 1px;
        background: #e2e8f0;
    }
`;

export default SectionLabel;