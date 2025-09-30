import React, { useState, useCallback } from 'react';
import { Topic, Language, VoiceStyle, StoryPart } from './types';
import { TOPIC_OPTIONS, LANGUAGE_OPTIONS, VOICE_STYLE_OPTIONS } from './constants';
import { generateStoryAndImages, ImageGenerationError } from './services/geminiService';
import SelectInput from './components/SelectInput';
import StoryOutput from './components/StoryOutput';
import SpinnerIcon from './components/icons/SpinnerIcon';
import NumberInput from './components/NumberInput';
import ImageToggle from './components/ImageToggle';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>(Topic.Honesty);
  const [language, setLanguage] = useState<string>(Language.English);
  const [voiceStyle, setVoiceStyle] = useState<string>(VoiceStyle.CartoonGirl);
  const [storyLength, setStoryLength] = useState<number>(3);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateStory = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setStoryParts([]);

    try {
      const generatedParts = await generateStoryAndImages(topic, language, storyLength, includeImages);
      setStoryParts(generatedParts);
    } catch (err) {
      if (err instanceof ImageGenerationError) {
        // If images failed but we have story text, show it with a specific message.
        setStoryParts(err.storyParts);
        setError(err.message);
      } else {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [topic, language, storyLength, includeImages]);

  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 flex flex-col items-center p-4 sm:p-6">
      <main className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg p-6 sm:p-8 space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-teal-600">
            Kid's Story Generator{' '}
            <span role="img" aria-label="child, book, speaker emojis">
              🧒📖🔊
            </span>
          </h1>
          <p className="text-gray-500 mt-2">Create magical stories for your little ones with the power of AI.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SelectInput
            label="Step 1: Select a Moral / Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            options={TOPIC_OPTIONS}
          />
          <SelectInput
            label="Step 2: Select Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={LANGUAGE_OPTIONS}
          />
          <SelectInput
            label="Step 3: Select Voice Style"
            value={voiceStyle}
            onChange={(e) => setVoiceStyle(e.target.value)}
            options={VOICE_STYLE_OPTIONS}
          />
          <NumberInput
            label="Step 4: Number of Parts"
            value={storyLength}
            onChange={(e) => setStoryLength(parseInt(e.target.value, 10))}
            min={2}
            max={6}
          />
          <div className="sm:col-span-2 flex justify-center">
             <ImageToggle
                label="Include Images"
                enabled={includeImages}
                onChange={setIncludeImages}
              />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGenerateStory}
            disabled={isGenerating}
            className="flex items-center justify-center gap-3 w-full max-w-md bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-orange-300"
          >
            {isGenerating ? (
              <>
                <SpinnerIcon />
                Creating your storybook...
              </>
            ) : (
              <>
                <span className="text-2xl" role="img" aria-label="magic wand">🔄</span> Generate Story
              </>
            )}
          </button>
        </div>

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Oh no! Something went wrong.</p>
                <p>{error}</p>
            </div>
        )}
        
        {(isGenerating || storyParts.length > 0) && (
            <StoryOutput 
              storyParts={storyParts} 
              isGenerating={isGenerating}
              voiceStyle={voiceStyle as VoiceStyle}
              language={language as Language}
            />
        )}
      </main>

      <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
        <p>Powered by AI | Safe for Kids</p>
      </footer>
    </div>
  );
};

export default App;
