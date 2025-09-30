import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { VoiceStyle, Language, StoryPart } from '../types';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import DownloadIcon from './icons/DownloadIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface StoryOutputProps {
  storyParts: StoryPart[];
  isGenerating: boolean;
  voiceStyle: VoiceStyle;
  language: Language;
}

const StoryOutput: React.FC<StoryOutputProps> = ({ storyParts, isGenerating, voiceStyle, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const fullStory = storyParts.map(p => p.paragraph).join('\n\n');

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const selectVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;

    let langCode: string;
    switch (language) {
      case Language.Hindi:
        langCode = 'hi-IN';
        break;
      case Language.Spanish:
        langCode = 'es-ES';
        break;
      case Language.French:
        langCode = 'fr-FR';
        break;
      case Language.German:
        langCode = 'de-DE';
        break;
      case Language.Mandarin:
        langCode = 'zh-CN';
        break;
      case Language.English:
      case Language.Bilingual:
      default:
        langCode = 'en-US';
    }

    const preferredVoices = voices.filter(v => v.lang.startsWith(langCode.substring(0, 2)));
    if (preferredVoices.length === 0) {
        const englishVoices = voices.find(v => v.lang.startsWith('en'));
        if (englishVoices) return englishVoices;
        return voices[0] || null;
    }

    let voice: SpeechSynthesisVoice | undefined;

    switch (voiceStyle) {
      case VoiceStyle.CartoonGirl:
      case VoiceStyle.Fairy:
        voice = preferredVoices.find(v => v.name.includes('Female') || v.name.includes('Girl'));
        break;
      case VoiceStyle.CartoonBoy:
      case VoiceStyle.FriendlyAnimal:
        voice = preferredVoices.find(v => v.name.includes('Male') || v.name.includes('Boy'));
        break;
      default:
        voice = preferredVoices[0];
    }
    
    return voice || preferredVoices[0];
  }, [voices, voiceStyle, language]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!fullStory) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(fullStory);
      const selectedVoice = selectVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        if(voiceStyle === VoiceStyle.Fairy) utterance.pitch = 1.5;
        if(voiceStyle === VoiceStyle.FriendlyAnimal) utterance.pitch = 0.8;
      }
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  }, [isPlaying, fullStory, selectVoice, voiceStyle]);

  const handleDownloadPdf = async () => {
    if (storyParts.length === 0) return;
    setIsDownloadingPdf(true);

    const tempDiv = document.createElement('div');
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Nunito, sans-serif';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';

    const titleHtml = `<div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 32px; font-weight: 800; color: #0D9488; margin: 0;">My Awesome Story</h2>
    </div>`;

    let contentHtml = '';
    storyParts.forEach(part => {
        if (part.paragraph) {
            contentHtml += `<p style="font-size: 20px; line-height: 1.6; color: #374151; text-align: justify; white-space: pre-wrap; margin-bottom: 24px; page-break-inside: avoid;">${part.paragraph}</p>`;
        }
        if (part.imageUrl) {
            contentHtml += `<img src="${part.imageUrl}" style="width: 100%; max-width: 600px; margin: 24px auto; display: block; border-radius: 8px; page-break-inside: avoid;" />`;
        }
    });

    tempDiv.innerHTML = titleHtml + contentHtml;
    document.body.appendChild(tempDiv);

    try {
        const images = Array.from(tempDiv.querySelectorAll('img'));
        const promises = images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('An image failed to load for PDF generation.'));
            });
        });
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save('my-storybook.pdf');
    } catch(e) {
        console.error("PDF generation failed", e);
        alert(`Sorry, could not generate the PDF. ${e instanceof Error ? e.message : ''}`);
    } finally {
        document.body.removeChild(tempDiv);
        setIsDownloadingPdf(false);
    }
  };

  const renderContent = () => {
    if (isGenerating && storyParts.length === 0) {
      return (
        <div className="w-full space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="w-full aspect-video bg-gray-200 animate-pulse rounded-lg mt-4 mb-6"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-4/6"></div>
           <div className="w-full aspect-video bg-gray-200 animate-pulse rounded-lg mt-4"></div>
        </div>
      );
    }
    
    if (storyParts.length === 0) return null;

    return storyParts.map((part, index) => (
      <div key={index}>
        <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap mb-4">
          {part.paragraph}
        </p>
        {part.imageUrl && (
            <img 
                src={part.imageUrl} 
                alt={`Illustration for the story, scene ${index + 1}`} 
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg my-6"
            />
        )}
      </div>
    ));
  };

  const isActionDisabled = storyParts.length === 0 || isGenerating || isDownloadingPdf;

  return (
    <div className="bg-teal-50/50 p-6 rounded-2xl shadow-inner space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-xl font-bold text-teal-700">✅ Your Magical Story</h3>
        <div className="flex items-center gap-2">
          <button onClick={handlePlayPause} disabled={!fullStory || voices.length === 0 || isGenerating} className="p-2 rounded-full bg-teal-500 text-white hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" aria-label={isPlaying ? "Pause story" : "Play story"}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={handleDownloadPdf} disabled={isActionDisabled} className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" aria-label="Download story as PDF">
            {isDownloadingPdf ? <SpinnerIcon /> : <DownloadIcon />}
          </button>
        </div>
      </div>
      <div className="bg-white/70 p-4 sm:p-6 rounded-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default StoryOutput;