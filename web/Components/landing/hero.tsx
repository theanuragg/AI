import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Components } from "react-markdown";
import DebateCardPopup from "./debatcard";

type Message = {
  type: "user" | "ai";
  text: string;
  html?: string;
};

export default function Hero() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDebatePopup, setShowDebatePopup] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHeading, setShowHeading] = useState(true);
  const [hasMessages, setHasMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (hasMessages) {
      scrollToBottom();
    }
  }, [messages, hasMessages]);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const userMessage: Message = { type: "user", text: inputText };
      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setShowHeading(false);
      setHasMessages(true);

      try {
        const response = await axios.post(
          `${process.env.BACKEND_URL}/api/generate`,
          { prompt: inputText }
        );
        console.log("API Response:", response.data);

        // Extract both raw text and HTML content
        const apiResponseText =
          response.data.text || "No message received from AI";
        const apiResponseHtml = response.data.html
          ? DOMPurify.sanitize(response.data.html)
          : "";

        const aiMessage: Message = {
          type: "ai",
          text: apiResponseText,
          html: apiResponseHtml,
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error while calling the API", error);
        const errorMessage: Message = {
          type: "ai",
          text: "Sorry, there was an error processing your request.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  };

  const handleStartDebate = (leftParty: string, rightParty: string): void => {
    console.log("Starting debate between:", leftParty, "and", rightParty);
    // Add your logic to navigate or start the debate
    setShowDebatePopup(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        buttonRef.current?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const components: Components = {
    code({
      inline,
      className,
      children,
      ...props
    }: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div
      className={`flex flex-col items-center w-full max-w-4xl mx-auto ${
        hasMessages ? "h-screen" : ""
      }`}
    >
      {/* Heading section */}
      {!hasMessages && (
        <div className="flex flex-col items-center justify-center flex-grow w-xl">
          {showHeading && (
            <h1 className="heading mb-10">Hey, how can I help you</h1>
          )}

          <div className="w-full bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <input
              className="w-full text-prompt  mb-4 focus:outline-none"
              placeholder=" ask your query here..........."
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="flex items-center">
              <div className="relative group">
                <div
                  className="flex items-center bg-white rounded-full px-3 py-1 border border-gray-200 hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"
                  onClick={() => setShowDebatePopup(true)}
                >
                  <Image src="/crab.webp" alt="" width={20} height={20} />
                  <span className="text-gray-500 px-1">debate</span>
                </div>

                {/* Tooltip below the button */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2  flex-col  opacity-100 hidden group-hover:flex items-center">
                  {/* Arrow pointing up */}
                  <div className="w-3 h-3   bg-gray-800 rotate-45 -mb-2"></div>

                  {/* Tooltip text box */}
                  <div className="bg-gray-800 border text-white text-xs font-mono px-3 py-2 rounded-md shadow-lg ">
                    working
                  </div>
                </div>
              </div>

              {showDebatePopup && (
                <DebateCardPopup
                  debateTopic={inputText}
                  onClose={() => setShowDebatePopup(false)}
                  onStart={handleStartDebate}
                />
              )}

              <div className="ml-auto">
                <button
                  ref={buttonRef}
                  className="rounded-full bg-black p-2 hover:scale-110 transition-transform duration-200 ease-in-out"
                  onClick={handleSendMessage}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages section */}
      {hasMessages && (
        <>
          <div className="w-full flex flex-col pt-10 px-4 pb-24 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg max-w-full mb-4  ${
                  message.type === "user"
                    ? "bg-gray-50 self-end  text-right"
                    : "bg-white  self-start  text-left"
                }`}
              >
                {message.type === "user" ? (
                  <div>{message.text}</div>
                ) : message.html ? (
                  <ReactMarkdown
                    components={components}
                    remarkPlugins={[]}
                    rehypePlugins={[]}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-line">{message.text}</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          <div className="w-xl bg-white rounded-xl shadow-lg p-4 border border-gray-100 fixed bottom-8 left-0 right-0  mx-auto">
            <input
              className="w-full text-style mb-4 focus:outline-none"
              placeholder="have a healthy debate............"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="flex items-center">
            <div className="relative group">
                <div
                  className="flex items-center bg-white rounded-full px-3 py-1 border border-gray-200 hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"
                  onClick={() => setShowDebatePopup(true)}
                >
                  <Image src="/crab.webp" alt="" width={20} height={20} />
                  <span className="text-gray-500 px-1">debate</span>
                </div>

                {/* Tooltip below the button */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2  flex-col  opacity-100 hidden group-hover:flex items-center">
                  {/* Arrow pointing up */}
                  <div className="w-3 h-3   bg-gray-800 rotate-45 -mb-2"></div>

                  {/* Tooltip text box */}
                  <div className="bg-gray-800 border text-white text-xs font-mono px-3 py-2 rounded-md shadow-lg ">
                    working
                  </div>
                </div>
              </div>

              {showDebatePopup && (
                <DebateCardPopup
                  debateTopic={inputText}
                  onClose={() => setShowDebatePopup(false)}
                  onStart={handleStartDebate}
                />
              )}

              <div className="ml-auto">
                <button
                  ref={buttonRef}
                  className="rounded-full bg-black p-2 hover:scale-110 transition-transform duration-200 ease-in-out"
                  onClick={handleSendMessage}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
