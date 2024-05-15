declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.png" {
  const value: any;
  export = value;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.md' {
  const content: string;
  export default content;
}