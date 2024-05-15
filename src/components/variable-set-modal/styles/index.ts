import { combineClassNames } from "@clinicaltoolkits/universal-react-components";
import styles from "./styles.module.css";

const input = styles.input;
const inputCenter = combineClassNames(input, styles.inputCenter);
const calendarHeader = styles.calendarHeader;
const labelText = styles.labelText;

export { input, inputCenter, calendarHeader, labelText };
