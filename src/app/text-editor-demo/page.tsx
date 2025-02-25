'use client';

import React from 'react';
import { TextEditorExample } from '@/components/ui/TextEditor/TextEditorExample';

export default function TextEditorDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Editor Component</h1>
          <p className="text-gray-600 mb-8">
            A reusable text editor with support for fluid editing, formatting options, and content insertion.
          </p>
          
          <div className="border-t border-gray-200 pt-8">
            <TextEditorExample />
          </div>
          
          <div className="mt-12 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Component Features</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Fluid Editing:</strong> Supports standard operations like text selection, backspace, copy, paste, etc.
              </li>
              <li>
                <strong>Floating Plus Button:</strong> A plus button that floats at the left margin next to the line where the mouse is hovering.
              </li>
              <li>
                <strong>Empty Line Placeholder:</strong> Displays placeholder text on any empty, focused line.
              </li>
              <li>
                <strong>Insertion Dropdown:</strong> When the user types "/" or clicks the plus button, shows a dropdown of insertion options.
              </li>
              <li>
                <strong>Keyboard Navigation:</strong> Supports keyboard navigation in the dropdown (arrow keys and Enter).
              </li>
              <li>
                <strong>Modular Design:</strong> Can be easily customized with different insertion options and styling.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 