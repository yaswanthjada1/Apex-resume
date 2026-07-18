import React, { useState } from 'react';

export default function ResumeBuilder({ setView }) {
  // Main state for the resume editor and its editable sections.
  const [resumeData, setResumeData] = useState({
    fullName: '',
    roleTitle: '',
    email: '',
    phone: '',
    location: '',
    summary: '', // Stores the professional summary that appears in the resume header.
    skills: [],
    experience: [
      {
        company: '',
        role: '',
        duration: '',
        description: ''
      }
    ]
  });

  // Stores the target role details used to tailor AI-generated resume content.
  const [targetJobContext, setTargetJobContext] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Updates a form field through a shared handler.
  const handleInputChange = (field, value) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  // Updates a single field inside an experience entry.
  const handleExperienceChange = (index, field, value) => {
    const updatedExp = [...resumeData.experience];
    updatedExp[index][field] = value;
    setResumeData(prev => ({ ...prev, experience: updatedExp }));
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      setResumeData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setResumeData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
  };

  const addExperienceBlock = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }]
    }));
  };

  const removeExperienceBlock = (indexToRemove) => {
    if (resumeData.experience.length > 1) {
      setResumeData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, idx) => idx !== indexToRemove)
      }));
    }
  };

  // Generates or refines the professional summary with the local AI model.
  const generateAiSummary = async () => {
    if (!targetJobContext.trim()) return;
    setIsSummaryGenerating(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-coder:1.5b',
          prompt: `You are an expert ATS corporate resume strategist. Write a concise, professional summary profile (About Me section) for a candidate targeting a role with these specifications.
          
          Target Job Details:
          """
          ${targetJobContext}
          """
          
          Output exactly a single paragraph of 2 to 3 sentences. Do not include markdown codeblocks, introductions, headers, or conversational preambles. Integrate the technical keywords naturally.`,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const cleanedText = data.response.replace(/```json|```/g, '').trim();
        handleInputChange('summary', cleanedText);
      }
    } catch (error) {
      console.error("Local engine communication failed during summary generation pass", error);
    } finally {
      setIsSummaryGenerating(false);
    }
  };

  // Rewrites experience descriptions so they align more closely with ATS expectations.
  const generateAiDescription = async (index) => {
    if (!targetJobContext.trim()) return;
    setIsAiGenerating(true);

    const expItem = resumeData.experience[index];
    const targetRole = expItem.role || resumeData.roleTitle || "Software Engineer";
    const baseText = expItem.description.trim();

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-coder:1.5b',
          prompt: `You are an expert ATS resume strategist. Write a concise, professional summary profile (About Me) for a candidate targeting a role with these specifications:
              \n\nTarget Job Details:\n${targetJobContext}\n\n
             CRITICAL INSTRUCTIONS: 
             - Do NOT blindly copy or state the exact years of experience mentioned in the job description.
             - Do NOT explicitly copy the raw bullet points from the "Requirements added by the job poster".
             - Focus on candidate execution, stack mastery, and architectural capability.
             - Output exactly a single paragraph of 2 to 3 sentences. No emojis, no markdown codeblocks.`,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const cleanedText = data.response.replace(/```json|```/g, '').trim();
        handleExperienceChange(index, 'description', cleanedText);
      }
    } catch (error) {
      console.error("Local engine communication failed during description compile pass", error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-120px)] print:h-auto print:p-0 print:m-0">

      {/* Header navigation for the builder view. */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 print:hidden">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setView('landing')} className="hover:text-red-500 transition-colors">Home</button>
          <span>&middot;</span>
          <span className="text-gray-900 font-semibold">Perfect Score Workspace</span>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-all flex items-center gap-1"
        >
          Export ATS Compliant PDF
        </button>
      </div>

      {/* Split layout for the editor and resume preview. */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0 print:block print:overflow-visible">

        {/* Editor panel for updating resume content. */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-y-auto space-y-5 print:hidden">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Modify Blueprint Specifications</h2>

          {/* Job details section used to guide AI-generated content. */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Target Job Context</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Paste Job Description / Requirements</label>
              <textarea
                placeholder="Paste target job specifications here. Everything generated by the local AI below will anchor tightly to these details to maximize ATS keyword alignment..."
                value={targetJobContext}
                onChange={(e) => setTargetJobContext(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs outline-none h-24 resize-none transition-all"
              />
            </div>
          </div>

          {/* Personal details section. */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={resumeData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs font-medium outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Target Role</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={resumeData.roleTitle}
                  onChange={(e) => handleInputChange('roleTitle', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs font-medium outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contact details section. */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input
                type="text"
                placeholder="developer@domain.com"
                value={resumeData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+91 00000 00000"
                value={resumeData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
              <input
                type="text"
                placeholder="City, Country"
                value={resumeData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs outline-none"
              />
            </div>
          </div>

          {/* Professional summary section. */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-500">Professional Summary Profile</label>
              <button
                type="button"
                disabled={isSummaryGenerating || !targetJobContext.trim()}
                onClick={generateAiSummary}
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${!targetJobContext.trim() ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                  }`}
              >
                {isSummaryGenerating ? 'Writing Summary...' : 'Auto-Generate via AI'}
              </button>
            </div>
            <textarea
              placeholder="Write a small description or click the link above to let the local AI craft a summary targeting the structural job context dynamically..."
              value={resumeData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs outline-none h-20 resize-none transition-all"
            />
          </div>

          {/* Technical skills section. */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Technical Skills</h3>
            <form onSubmit={addSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Press Enter or click Add..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 focus:border-red-500 rounded-lg p-2 text-xs outline-none"
              />
              <button
                type="submit"
                className="bg-gray-800 text-white text-xs font-bold px-4 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {resumeData.skills.length === 0 && (
                <span className="text-xs text-gray-400 italic">No skill tags added yet.</span>
              )}
              {resumeData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-1 rounded-md"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-gray-400 hover:text-red-500 font-bold ml-0.5 text-xs line-height-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Work experience section. */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Work Experience</h3>
              <button
                type="button"
                onClick={addExperienceBlock}
                className="text-xs font-bold text-gray-600 hover:text-red-500 transition-colors flex items-center gap-0.5"
              >
                Add Position
              </button>
            </div>

            {resumeData.experience.map((exp, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50 relative group">
                {resumeData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperienceBlock(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm font-bold print:hidden"
                  >
                    &times;
                  </button>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-400">Company</label>
                    <input
                      type="text"
                      placeholder="Company Inc."
                      value={exp.company}
                      onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-400">Job Title</label>
                    <input
                      type="text"
                      placeholder="Role Title"
                      value={exp.role}
                      onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-400">Dates</label>
                    <input
                      type="text"
                      placeholder="MM/YYYY - Present"
                      value={exp.duration}
                      onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-gray-400">Job Responsibilities</label>
                    <button
                      type="button"
                      disabled={isAiGenerating || !targetJobContext.trim()}
                      onClick={() => generateAiDescription(idx)}
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${!targetJobContext.trim() ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                        }`}
                    >
                      {isAiGenerating ? 'Enhancing Content...' : 'Convert Text to ATS Standard via AI'}
                    </button>
                  </div>
                  <textarea
                    placeholder="Provide brief context details here. The AI will inject industry action verbs and optimize structure cleanly..."
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded p-2 text-xs outline-none focus:border-red-500 h-24 resize-none font-sans"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resume preview panel with a print layout. */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-inner flex flex-col items-center justify-start overflow-y-auto print:bg-white print:border-none print:p-0 print:shadow-none print:overflow-visible">

          {/* Preview container that mirrors a printed resume page. */}
          <div className="w-full max-w-[210mm] bg-white text-black p-8 font-serif shadow-2xl min-h-[297mm] printable-canvas text-[11px] leading-relaxed select-text print:shadow-none print:p-0 print:min-h-0">

            {/* Resume header content. */}
            <div className="text-center border-b border-gray-300 pb-3 mb-4">
              <h1 className="text-xl font-bold tracking-wide uppercase font-sans mb-1 min-h-[28px]">
                {resumeData.fullName || 'YOUR NAME'}
              </h1>
              <p className="text-xs font-semibold text-gray-700 font-sans tracking-wide mb-2 min-h-[18px]">
                {resumeData.roleTitle || 'PROFESSIONAL TARGET TITLE'}
              </p>
              <div className="text-gray-600 flex justify-center gap-4 text-[10px] font-sans min-h-[14px]">
                {resumeData.location && <span>{resumeData.location}</span>}
                {resumeData.email && <span>{resumeData.email}</span>}
                {resumeData.phone && <span>{resumeData.phone}</span>}
              </div>
            </div>

            {/* Professional summary section in the preview. */}
            {resumeData.summary && (
              <div className="mb-4 break-inside-avoid">
                <h2 className="text-xs font-bold text-gray-900 border-b border-black uppercase tracking-wider mb-2 font-sans">Professional Summary</h2>
                <p className="text-gray-700 pl-2 text-justify">{resumeData.summary}</p>
              </div>
            )}

            {/* Work experience section in the preview. */}
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-900 border-b border-black uppercase tracking-wider mb-2 font-sans">Professional Experience</h2>
              {resumeData.experience.every(e => !e.company && !e.role && !e.description) ? (
                <p className="text-gray-400 italic text-[10px] pl-2">Timeline records will render here dynamically.</p>
              ) : (
                resumeData.experience.map((exp, idx) => (
                  (exp.company || exp.role || exp.description) && (
                    <div key={idx} className="mb-3 break-inside-avoid">
                      <div className="flex justify-between font-sans font-bold text-[11px] text-gray-900">
                        <span>{exp.company || 'Organization'}{exp.role ? ` — ${exp.role}` : ''}</span>
                        <span className="font-normal text-gray-600 text-[10px]">{exp.duration || 'Timeline'}</span>
                      </div>
                      {exp.description && (
                        <p className="text-gray-700 mt-1 pl-2 border-l border-gray-200 text-justify whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  )
                ))
              )}
            </div>

            {/* Technical skills section in the preview. */}
            <div>
              <h2 className="text-xs font-bold text-gray-900 border-b border-black uppercase tracking-wider mb-2 font-sans">Technical Expertise</h2>
              <p className="text-gray-700 pl-2">
                <strong className="font-sans text-[10px] text-gray-900">Core Technologies: </strong>
                {resumeData.skills.length > 0 ? resumeData.skills.join(', ') : 'Asset tokens list empty.'}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}