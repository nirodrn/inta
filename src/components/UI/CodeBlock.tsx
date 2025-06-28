// src/components/UI/CodeBlock.tsx

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  return (
    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ borderRadius: '0.5rem', margin: 0 }}>
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;