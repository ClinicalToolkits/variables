import { black, lightGray, CssVariables, white, dark, ctSpacing } from "@clinicaltoolkits/universal-react-components";
import { createTheme } from "@mantine/core";

export const themeOverridesTest = createTheme({
  fontFamily: "Almarai, sans-serif",

  lineHeights: {
    xs: "1.4",
    sm: "1.45",
    md: "normal",
    lg: "1.6",
    xl: "1.65",
  },
});

export const cssVariableOverrides: CssVariables = {
  variables: {
    "--CT-spacing-paper-default": ctSpacing.md,
    "--CT-font-family-default": "Almarai, sans-serif",
    "--mantine-font-family": "Almarai, sans-serif",
  },
  light: {
    "--CT-colors-background": lightGray[0],
    "--CT-colors-paper-background": white[0],
  },
  dark: {
    "--CT-colors-background": black[0],
    "--CT-colors-paper-background": dark[9],
  },
};
