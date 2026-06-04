declare module 'react-syntax-highlighter' {
  import type { ComponentType } from 'react';

  export const Prism: ComponentType<any>;
  export default Prism;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const atomDark: Record<string, any>;
  const styles: Record<string, any>;
  export default styles;
}
