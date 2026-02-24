'use client';
import React, { useCallback, useRef, useState } from 'react';
import { SAMPLE_XML } from '@/lib/xmlParser';
// SAMPLE_XML now includes both COLLECTION and PLAYLISTS for a realistic demo

interface Props {
  onXml: (xml: string) => void;
  isLoading: boolean;
}

export default function UploadPanel({ onXml, isLoading }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onXml(e.target?.result as string);
    reader.readAsText(file);
  }, [onXml]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-[#00e5ff] bg-[#00e5ff10]'
            : 'border-[#2a2a32] hover:border-[#00e5ff60] hover:bg-[#00e5ff05]'
          }
        `}
      >
        <input ref={inputRef} type="file" accept=".xml" className="hidden" onChange={onFileChange} />
        <div className="flex flex-col items-center gap-3">
          <svg className={`w-12 h-12 ${dragging ? 'text-[#00e5ff]' : 'text-[#444460]'} transition-colors`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-[#e8e8f0] font-mono text-sm uppercase tracking-widest">
              {isLoading ? 'Parsing...' : 'Drop Rekordbox XML'}
            </p>
            <p className="text-[#666680] text-xs mt-1">or click to browse</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onXml(SAMPLE_XML)}
        disabled={isLoading}
        className="w-full py-2 text-xs font-mono uppercase tracking-widest text-[#666680] hover:text-[#00e5ff] border border-[#2a2a32] hover:border-[#00e5ff40] rounded transition-all"
      >
        Load Sample XML (8 Tracks)
      </button>
    </div>
  );
}
