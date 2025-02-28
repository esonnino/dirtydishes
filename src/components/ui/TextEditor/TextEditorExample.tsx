'use client';

import React, { useState } from 'react';
import { TextEditor, InsertionOption } from './TextEditor';
import { PlusIcon } from '../icons/PlusIcon';
import { SparkleIcon } from '../icons/SparkleIcon';

// Example icons for insertion options
const TextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);

const ImageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const TableIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CodeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
);

export const TextEditorExample: React.FC = () => {
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Define insertion options
  const insertionOptions: InsertionOption[] = [
    {
      id: 'ai-prompt',
      icon: <SparkleIcon />,
      label: 'AI Prompt',
      description: 'Ask AI to help with your writing',
      action: (editor, line) => {
        // Create a container for the AI prompt
        const promptContainer = document.createElement('div');
        promptContainer.className = 'ai-prompt-container';
        
        // Create the content element
        const promptContent = document.createElement('div');
        promptContent.className = 'ai-prompt-content';
        promptContent.setAttribute('contenteditable', 'true');
        promptContent.innerHTML = '';
        promptContent.setAttribute('data-placeholder', 'Ask AI to help you write something...');
        
        // Create the sparkle icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'ai-prompt-icon';
        iconDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="16" height="16">
            <path d="M12 1L9.5 8.5L2 11L9.5 13.5L12 21L14.5 13.5L22 11L14.5 8.5L12 1Z" />
            <path d="M5 14.5L4 19L7 17L10 19L8.5 14.5" opacity="0.5" />
            <path d="M19 14.5L20 19L17 17L14 19L15.5 14.5" opacity="0.5" />
          </svg>
        `;
        
        // Add the content and icon to the container
        promptContainer.appendChild(promptContent);
        promptContainer.appendChild(iconDiv);
        
        // Insert after the current line
        if (line.nextSibling) {
          editor.insertBefore(promptContainer, line.nextSibling);
        } else {
          editor.appendChild(promptContainer);
        }
        
        // Set focus to the prompt content
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(promptContent);
        range.collapse(true); // Place cursor at the beginning
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Add event listener for the AI prompt interaction
        promptContent.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            // In a real application, here you would send the prompt to an AI API
            // For now, we'll simulate a response
            const promptText = promptContent.textContent || '';
            if (promptText.trim()) {
              // Create a loading indicator
              promptContent.innerHTML = `<em style="color: #6b7280;">Processing your request...</em>`;
              
              // Simulate AI response after a delay
              setTimeout(() => {
                // Replace with a simulated response
                promptContent.innerHTML = `<div style="color: #3b82f6;">
                  <p>Here's a response to your prompt: "${promptText}"</p>
                  <p>In a real implementation, this would be connected to an AI service that would generate text based on your prompt.</p>
                </div>`;
              }, 1500);
            }
          }
        });
      }
    },
    {
      id: 'heading1',
      icon: <TextIcon />,
      label: 'Heading 1',
      description: 'Large section heading',
      action: (editor, line) => {
        // Create a new h1 element
        const h1 = document.createElement('h1');
        h1.style.fontSize = '1.875rem'; // text-3xl
        h1.style.fontWeight = 'bold';
        h1.style.marginTop = '1.5rem';
        h1.style.marginBottom = '1rem';
        h1.innerHTML = ''; // Empty content
        h1.setAttribute('data-placeholder', 'Main Heading');
        
        // Insert the new h1 after the current line
        if (line.nextSibling) {
          editor.insertBefore(h1, line.nextSibling);
        } else {
          editor.appendChild(h1);
        }
        
        // Set focus to the heading
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(h1);
        range.collapse(true); // Place cursor at the beginning
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    },
    {
      id: 'heading2',
      icon: <TextIcon />,
      label: 'Heading 2',
      description: 'Medium section heading',
      action: (editor, line) => {
        // Create a new h2 element
        const h2 = document.createElement('h2');
        h2.style.fontSize = '1.5rem'; // text-2xl
        h2.style.fontWeight = 'bold';
        h2.style.marginTop = '1.25rem';
        h2.style.marginBottom = '0.75rem';
        h2.innerHTML = ''; // Empty content
        h2.setAttribute('data-placeholder', 'Section Heading');
        
        // Insert the new h2 after the current line
        if (line.nextSibling) {
          editor.insertBefore(h2, line.nextSibling);
        } else {
          editor.appendChild(h2);
        }
        
        // Set focus to the heading
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(h2);
        range.collapse(true); // Place cursor at the beginning
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    },
    {
      id: 'heading3',
      icon: <TextIcon />,
      label: 'Heading 3',
      description: 'Smaller section heading',
      action: (editor, line) => {
        // Create a new h3 element
        const h3 = document.createElement('h3');
        h3.style.fontSize = '1.25rem'; // text-xl
        h3.style.fontWeight = 'bold';
        h3.style.marginTop = '1rem';
        h3.style.marginBottom = '0.5rem';
        h3.innerHTML = ''; // Empty content
        h3.setAttribute('data-placeholder', 'Subsection Heading');
        
        // Insert the new h3 after the current line
        if (line.nextSibling) {
          editor.insertBefore(h3, line.nextSibling);
        } else {
          editor.appendChild(h3);
        }
        
        // Set focus to the heading
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(h3);
        range.collapse(true); // Place cursor at the beginning
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    },
    {
      id: 'bullet-list',
      icon: <TextIcon />,
      label: 'Bullet List',
      description: 'Create a bulleted list',
      action: (editor, line) => {
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'disc';
        ul.style.paddingLeft = '1.5rem';
        ul.style.marginTop = '0.5rem';
        ul.style.marginBottom = '0.5rem';
        
        const li = document.createElement('li');
        li.innerHTML = ''; // Empty content
        li.setAttribute('data-placeholder', 'List item');
        ul.appendChild(li);
        
        // Insert after the current line
        if (line.nextSibling) {
          editor.insertBefore(ul, line.nextSibling);
        } else {
          editor.appendChild(ul);
        }
        
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(li);
        range.collapse(true); // Place cursor at the beginning
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    },
    {
      id: 'image',
      icon: <ImageIcon />,
      label: 'Image',
      description: 'Upload an image',
      action: (editor, line) => {
        // In a real app, you would trigger an image upload here
        const imgContainer = document.createElement('div');
        imgContainer.style.textAlign = 'center';
        imgContainer.style.margin = '1rem 0';
        
        imgContainer.innerHTML = `
          <div style="border: 2px dashed #cbd5e0; border-radius: 0.375rem; padding: 2rem; cursor: pointer;">
            <span style="display: block; text-align: center; color: #718096;">
              Click to upload an image
            </span>
          </div>
        `;
        
        // Insert after the current line
        if (line.nextSibling) {
          editor.insertBefore(imgContainer, line.nextSibling);
        } else {
          editor.appendChild(imgContainer);
        }
      }
    },
    {
      id: 'table',
      icon: <TableIcon />,
      label: 'Table',
      description: 'Insert a table',
      action: (editor, line) => {
        const tableContainer = document.createElement('div');
        tableContainer.style.margin = '1rem 0';
        tableContainer.style.overflowX = 'auto';
        
        tableContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left;">Header 1</th>
                <th style="border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left;">Header 2</th>
                <th style="border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left;">Header 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #e2e8f0; padding: 0.75rem;">Cell 1</td>
                <td style="border: 1px solid #e2e8f0; padding: 0.75rem;">Cell 2</td>
                <td style="border: 1px solid #e2e8f0; padding: 0.75rem;">Cell 3</td>
              </tr>
              <tr>
                <td style="border: 1px solid #e2e8f0; padding: 0.75rem;">Cell 4</td>
                <td style="border: 1px solid #e2e8f0; padding: 0.75rem;">Cell 5</td>
                <td style="border: 1px solid #e2e8f0; padding: 0.75rem;">Cell 6</td>
              </tr>
            </tbody>
          </table>
        `;
        
        // Insert after the current line
        if (line.nextSibling) {
          editor.insertBefore(tableContainer, line.nextSibling);
        } else {
          editor.appendChild(tableContainer);
        }
      }
    },
    {
      id: 'code',
      icon: <CodeIcon />,
      label: 'Code Block',
      description: 'Insert a code snippet',
      action: (editor, line) => {
        const codeContainer = document.createElement('div');
        codeContainer.style.margin = '1rem 0';
        
        codeContainer.innerHTML = `
          <pre style="background-color: #f7fafc; border-radius: 0.375rem; padding: 1rem; overflow-x: auto;">
            <code style="font-family: monospace;">// Your code here
function example() {
  console.log('Hello world!');
}</code>
          </pre>
        `;
        
        // Insert after the current line
        if (line.nextSibling) {
          editor.insertBefore(codeContainer, line.nextSibling);
        } else {
          editor.appendChild(codeContainer);
        }
      }
    }
  ];

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleTextSelect = (text: string) => {
    setSelectedText(text);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Text Editor Example</h1>
      
      <div className="mb-6">
        <TextEditor
          onChange={handleContentChange}
          onSelect={handleTextSelect}
          placeholder="Start typing or use the + button to insert content..."
          emptyLinePlaceholder="Press the + button or type / to insert"
          insertionOptions={insertionOptions}
          className="min-h-[300px]"
        />
      </div>
      
      {selectedText && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <h2 className="text-sm font-medium text-gray-700">Selected Text:</h2>
          <p className="mt-1 text-gray-600">{selectedText}</p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Editor Content Preview:</h2>
        <div className="p-4 border border-gray-200 rounded-md">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}; 