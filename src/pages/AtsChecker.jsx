import React, { useState, useRef } from 'react';
import useOllama from '../hooks/useOllama';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const extractRequirementStrings = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalizedLines = text
    .replace(/\r/g, '')
    .replace(/[•◦▪●]\s*/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const requirements = [];

  normalizedLines.forEach((line) => {
    line
      .split(';')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => {
        const cleaned = segment.replace(/^[-*]\s*/, '').trim();
        if (cleaned) {
          requirements.push(cleaned);
        }
      });
  });

  if (requirements.length === 0) {
    const fallback = text.replace(/\s+/g, ' ').trim();
    return fallback ? [fallback] : [];
  }

  return Array.from(new Set(requirements));
};

const normalizeKeywordList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

export default function AtsChecker({ setView, onAnalysisStateChange }) {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [parsing, setParsing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Stores the local model name entered by the user.
  const [modelName, setModelName] = useState('qwen2.5-coder:1.5b');

  const fileInputRef = useRef(null);
  const jobDescriptionRef = useRef(null);
  const { generateCompletion, loading: aiLoading, error: aiError } = useOllama();

  const handleFileUpload = async (file) => {
    if (!file) return;
    setParsing(true);

    try {
      const fileName = file.name.toLowerCase();

      if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setResumeText(e.target.result);
          setParsing(false);
        };
        reader.readAsText(file);
      }
      else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(' ');
          fullText += pageText + '\n';
        }

        const cleanedText = fullText
          .replace(/(?<=^|\s)([A-Za-z])\s(?=[A-Za-z](?:\s|$))/g, '$1')
          .replace(/(?<=^|\s)([A-Za-z])\s([A-Za-z])(?:\s|$)/g, '$1$2')
          .replace(/\s+/g, ' ');

        setResumeText(cleanedText.trim());
        setParsing(false);
      }
      else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
        setParsing(false);
      } else {
        alert('Unsupported format. Please supply a valid .pdf, .docx, or .txt file.');
        setParsing(false);
      }
    } catch (error) {
      console.error('Local file extraction system breakdown: ', error);
      alert('Error parsing document typography streams. Ensure file is unencrypted.');
      setParsing(false);
    }
  };

  const handleDragOver = (e) => e.preventDefault() || setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files[0]);
  };

const handleRunAnalysis = async () => {
    const activeJobDescription = (
      jobDescriptionRef.current?.value ?? jobDescription ?? ''
    ).trim();

    if (!resumeText || !activeJobDescription) {
      alert('Please populate both the resume text node and the job description parameter.');
      return;
    }
    if (!modelName.trim()) {
      alert('Please input a target local model identifier.');
      return;
    }

    onAnalysisStateChange?.({ isAnalyzing: true, connected: true });
    setJobDescription(activeJobDescription);
    setAnalysisResults(null);

    const requirementStrings = extractRequirementStrings(activeJobDescription);
    const systemPrompt = `You are a strict ATS keyword verification engine.
Return ONLY valid JSON with exactly this shape:
{"validatedMatches":[],"missingHighValueKeywords":[]}

Rules:
- Compare the Resume Text to the requirement strings provided below.
- If a requirement string appears in the Resume Text, copy it exactly into validatedMatches.
- If a requirement string does not appear in the Resume Text, copy it exactly into missingHighValueKeywords.
- Use only strings from the requirement list below.
- Do not paraphrase, summarize, invent, or add any extra keys.
- Do not include markdown, code fences, explanations, or preambles.
- Output pure JSON only.

Requirement Strings:
${JSON.stringify(requirementStrings)}`;

    const userContent = `Resume Text:\n${resumeText}\n\nTarget Job Description:\n${activeJobDescription}`;

    try {
      const rawAiResult = await generateCompletion(modelName.trim(), systemPrompt, userContent);
      let parsedJson = null;

      if (rawAiResult) {
        let cleanJsonString = rawAiResult.trim();

        if (cleanJsonString.includes('```')) {
          cleanJsonString = cleanJsonString.replace(/```json|```/gi, '').trim();
        }

        const firstBracket = cleanJsonString.indexOf('{');
        const lastBracket = cleanJsonString.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanJsonString = cleanJsonString.slice(firstBracket, lastBracket + 1);
        }

        try {
          parsedJson = JSON.parse(cleanJsonString);
        } catch (jsonError) {
          console.warn('Model response was not valid JSON. Falling back to deterministic matching.', jsonError);
        }
      }

      const deterministicValidated = requirementStrings.filter((requirement) =>
        resumeText.toLowerCase().includes(requirement.toLowerCase())
      );
      const deterministicMissing = requirementStrings.filter(
        (requirement) => !deterministicValidated.includes(requirement)
      );

      const modelValidated = normalizeKeywordList(parsedJson?.validatedMatches);
      const modelMissing = normalizeKeywordList(parsedJson?.missingHighValueKeywords);

      const validatedMatches = Array.from(
        new Set([
          ...modelValidated.filter((item) => requirementStrings.includes(item)),
          ...deterministicValidated,
        ])
      );
      const missingHighValueKeywords = Array.from(
        new Set([
          ...modelMissing.filter((item) => requirementStrings.includes(item)),
          ...deterministicMissing,
        ])
      ).filter((item) => !validatedMatches.includes(item));

      const totalCount = validatedMatches.length + missingHighValueKeywords.length;
      const score = totalCount > 0 ? Math.round((validatedMatches.length / totalCount) * 100) : 0;

      onAnalysisStateChange?.({ isAnalyzing: false, connected: true });
      setAnalysisResults({
        score,
        matched: validatedMatches,
        missing: missingHighValueKeywords,
        density: score,
      });
    } catch (err) {
      console.error('ATS analysis failed:', err);
      const isConnectionIssue = /fetch|network|connection|timed out|abort|status:/i.test(err?.message || '');
      onAnalysisStateChange?.({ isAnalyzing: false, connected: !isConnectionIssue });
      alert('The local model generated unstructured data context. Please try executing the pass again.');
    }
  };
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 animate-fade-in">

      {/* Page header with the return link and page title. */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <button onClick={() => setView('landing')} className="hover:text-brand-primary transition-colors">Home</button>
            <span>&middot;</span>
            <span className="text-gray-900 font-medium">ATS Optimization Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Compliance Scanner Workspace</h1>
        </div>
      </div>

      {/* Main layout for the input form and results sidebar. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main input column for resume and job description content. */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">

            {/* File upload area for importing a resume document. */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Ingest Existing Document Matrix
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !parsing && fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[176px] ${isDragging
                  ? 'border-brand-primary bg-rose-50 text-brand-hover'
                  : 'border-gray-300 hover:border-brand-primary bg-gray-50 text-gray-500'
                  } ${parsing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  disabled={parsing}
                />
                <div className={`transition-colors duration-200 ${isDragging ? 'text-red-500' : 'text-gray-400'}`}>
                  <svg viewBox="0 0 64 64" className="h-10 w-10 fill-none stroke-current stroke-[2]">
                    <path d="M32 12v24" />
                    <path d="M24 28l8 8 8-8" />
                    <path d="M18 36h28" />
                    <path d="M18 44h28" />
                  </svg>
                </div>
                <p className="text-xs font-semibold">
                  {parsing ? 'Parsing structural layout strings locally...' : 'Drag & drop your previous resume here, or '}
                  {!parsing && <span className="text-brand-primary">browse files</span>}
                </p>
                <span className="text-[10px] text-gray-400">Accepts PDF, DOCX, and TXT files instantly</span>
              </div>
            </div>

            {/* Resume content editor. */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Resume Text Context
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Data will auto-populate here on file upload drop, or you can paste raw characters manually..."
                className="w-full h-40 bg-gray-50 border border-gray-200 focus:border-brand-primary rounded-xl p-3 text-xs font-mono outline-none transition-all resize-none"
              />
            </div>

            {/* Job description editor. */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Target Job Specification Blueprint
              </label>
              <textarea
                ref={jobDescriptionRef}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description details from LinkedIn, Wellfound, or Cuvette here..."
                className="w-full h-40 bg-gray-50 border border-gray-200 focus:border-brand-primary rounded-xl p-3 text-xs font-mono outline-none transition-all resize-none"
              />
            </div>

          </div>
        </div>

        {/* Sidebar for analysis results and model settings. */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Analysis results panel. */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex-grow min-h-[350px] flex flex-col justify-between transition-all duration-200">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2 mb-4">
                Optimization Analytics
              </h2>

              {aiError ? (
                <div className="bg-rose-50 border border-rose-100 text-brand-primary p-3 rounded-lg text-xs font-medium">
                  &#10007; Connection Refused: Ensure Ollama is actively running in your background command line terminal.
                </div>
              ) : !analysisResults && !aiLoading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-10 text-center text-gray-400 transition-all duration-200">
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                      <svg viewBox="0 0 64 64" className="h-7 w-7 fill-none stroke-current stroke-[2]">
                        <rect x="16" y="16" width="32" height="32" rx="4" />
                        <path d="M24 28h16" />
                        <path d="M24 36h10" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-500">Await structural stream data context input.</p>
                  </div>
                </div>
              ) : aiLoading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-10 text-center transition-all duration-200">
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Analyzing Compliance Matrix...</p>
                      <p className="mt-1 text-xs text-gray-500">Executing local model pass via Ollama engine.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Match Score</span>
                    <div className={`text-4xl font-extrabold my-1 ${analysisResults.score >= 80 ? 'text-green-600' : analysisResults.score >= 50 ? 'text-yellow-500' : 'text-brand-primary'}`}>
                      {analysisResults.score}%
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {analysisResults.score >= 80 ? 'Target Threshold Satisfied for Parser passes.' : 'Keyword concentration level suboptimal.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Missing High-Value Keywords</span>
                    {!analysisResults.missing || analysisResults.missing.length === 0 ? (
                      <p className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
                        &#10003; Complete structural alignment! No core missing keywords detected.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResults.missing.map((keyword, i) => (
                          <span key={i} className="bg-rose-50 border border-rose-100 text-brand-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                            + {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Validated Matches</span>
                    {!analysisResults.matched || analysisResults.matched.length === 0 ? (
                      <span className="text-xs text-gray-400 block italic">No validated core stack keywords identified.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResults.matched.map((keyword, i) => (
                          <span key={i} className="bg-green-50 border border-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase">
                            &#10003; {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {analysisResults && (
              <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Token Structural Density:</span>
                <span className="font-bold text-gray-900">{analysisResults.density}%</span>
              </div>
            )}
          </div>

          {/* Local model configuration field. */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Active Local Model Identifier
            </label>
            <input 
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., qwen2.5-coder:1.5b"
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-primary rounded-lg p-2 text-xs font-mono outline-none font-medium transition-all"
            />
          </div>

          {/* Button to start the local ATS analysis. */}
          <button
            onClick={handleRunAnalysis}
            disabled={aiLoading || parsing}
            className="w-full bg-brand-primary hover:bg-brand-hover disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow text-sm flex items-center justify-center gap-2"
          >
            {aiLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Evaluating with Local Target Node...
              </>
            ) : (
              'Execute Local ATS Analysis Pass'
            )}
          </button>

        </div>

      </div>
    </div>
  );
}