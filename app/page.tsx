"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

////////////////////////////////////////////////////////////////////////////////
// A tiny “typewriter” component: it receives `fullText` and
// reveals it one character at a time whenever `fullText` changes.
//
function TypewriterText({ fullText }: { fullText: string }) {
  const [displayed, setDisplayed] = useState<string>("");

  useEffect(() => {
    let idx = 0;
    setDisplayed("");

    // If fullText is empty, do nothing.
    if (!fullText) {
      return;
    }

    const interval = setInterval(() => {
      idx += 1;
      setDisplayed(fullText.slice(0, idx));

      // Once we've shown all characters, stop.
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 30); // 30ms per character → adjust speed here if you want faster/slower

    return () => clearInterval(interval);
  }, [fullText]);

  return <>{displayed}</>;
}

////////////////////////////////////////////////////////////////////////////////
// Main KetonAI component
export default function KetonAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [logoVisible, setLogoVisible] = useState<boolean>(true);
  const [placeholderText, setPlaceholderText] = useState<string>("");
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<{ left: number; top: number }[]>([]);

  const fullPlaceholder = "How can we help you today?";

  // ——— Placeholder typing effect (looping) until the user focuses
  useEffect(() => {
    if (!showChat) {
      const timer = setTimeout(() => {
        if (placeholderIndex < fullPlaceholder.length) {
          setPlaceholderText(fullPlaceholder.slice(0, placeholderIndex + 1));
          setPlaceholderIndex((i) => i + 1);
        } else {
          // Once we reach full placeholder, wait 3s, then reset
          const pause = setTimeout(() => {
            setPlaceholderText("");
            setPlaceholderIndex(0);
          }, 3000);
          return () => clearTimeout(pause);
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [placeholderIndex, showChat]);

  // ——— Scroll to bottom whenever messages or typing indicator changes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ——— Generate random “particles” positions on mount
  useEffect(() => {
    const generated = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
    }));
    setParticles(generated);
  }, []);

  // ——— handleSendMessage
  // — We push a user message immediately. Then we push a “placeholder” AI message with text: "".
  // — We wait for the BACKEND to return its entire response as a string (response.text()).
  // — Once we have fullText, we replace the placeholder AI message with that fullText.
  // — That triggers <TypewriterText> to animate on screen.
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // 1) Add the user’s own message:
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowChat(true);
    setLogoVisible(false);
    setIsTyping(true);

    // 2) Immediately add a placeholder AI message with empty text:
    const placeholderId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: placeholderId,
        text: "",
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    try {
      // 3) Fetch the backend in one go (instead of streaming) so we can run our typewriter:
      const response = await fetch("https://ketonai-backend.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      // Wait for the FULL text body:
      const fullText = await response.text();

      // 4) Replace the placeholder AI bubble’s text with the complete text:
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? { ...msg, text: fullText }
            : msg
        )
      );
    } catch (err) {
      console.error("Fetch error:", err);
      // In case of error, replace placeholder with an error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                ...msg,
                text: "Oops! Something went wrong connecting to the server.",
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleInputFocus = () => {
    if (!showChat) {
      setShowChat(true);
      setLogoVisible(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-hidden">
      {/* Background with noisy gradient */}
      <motion.div
        className="absolute inset-4 rounded-2xl overflow-hidden z-0"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div
          className="w-full h-full bg-cover bg-center relative"
          style={{
            backgroundImage: "url(/images/noisy-gradients.png)",
            filter: "brightness(1.1) contrast(1.05)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
        </div>
      </motion.div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Top Section - Logo and Taglines */}
        <div className="flex-1 flex items-center justify-center pt-16">
          <AnimatePresence>
            {logoVisible && (
              <motion.div
                className="flex flex-col items-center px-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: -100,
                  scale: 0.8,
                  filter: "blur(10px)",
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                  exit: { duration: 1.2 },
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 1.5,
                    ease: "easeOut",
                    delay: 0.3,
                  }}
                  whileHover={{
                    scale: 1.05,
                    rotate: 5,
                    transition: { duration: 0.3 },
                  }}
                >
                  <Image
                    src="/images/logo.png"
                    alt="KetonAI Logo"
                    width={140}
                    height={140}
                    className="object-contain drop-shadow-2xl"
                  />
                </motion.div>

                <motion.h1
                  className="font-playfair text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-medium text-black uppercase mt-1 tracking-wider text-center"
                  initial={{ opacity: 0, letterSpacing: "0.5em" }}
                  animate={{ opacity: 1, letterSpacing: "0.1em" }}
                  transition={{
                    duration: 2,
                    ease: "easeOut",
                    delay: 0.8,
                  }}
                  style={{
                    textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  KETONAI
                </motion.h1>

                <motion.div
                  className="flex flex-col items-center mt-6 space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 1,
                    delay: 1.5,
                    ease: "easeOut",
                  }}
                >
                  <p className="text-black/80 text-base sm:text-lg font-mono tracking-wide text-center">
                    Your personal AI coach for all things keto.
                  </p>
                  <p className="text-black/80 text-base sm:text-lg font-mono tracking-wide text-center">
                    {"Let's plan your next keto win 🥑🔥"}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Middle Section - Chat Area */}
        <div className="flex-1 flex items-start justify-center px-4 pt-8 mb-8">
          <AnimatePresence>
            {showChat && (
              <motion.div
                className="w-full max-w-4xl"
                initial={{ opacity: 0, scale: 0.8, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 100 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 100,
                }}
              >
                <div
                  ref={chatRef}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-4 sm:p-6 h-[45vh] overflow-y-auto shadow-2xl"
                >
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        className={`flex ${
                          message.isUser ? "justify-end" : "justify-start"
                        }`}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                      >
                        <div
                          className={`max-w-[80%] p-3 sm:p-4 rounded-2xl font-mono ${
                            message.isUser
                              ? "bg-black/20 text-white ml-auto backdrop-blur-sm"
                              : "bg-white/20 text-black backdrop-blur-sm"
                          } shadow-lg border border-white/10`}
                        >
                          <p className="text-xs sm:text-sm leading-relaxed tracking-wide whitespace-pre-wrap">
                            {message.isUser ? (
                              message.text
                            ) : (
                              // For AI messages, hand off to TypewriterText:
                              <TypewriterText fullText={message.text} />
                            )}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-white/20 text-black p-3 sm:p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                          <div className="flex space-x-1">
                            <motion.div
                              className="w-3 h-3 bg-black/60 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0,
                              }}
                            />
                            <motion.div
                              className="w-3 h-3 bg-black/60 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.2,
                              }}
                            />
                            <motion.div
                              className="w-3 h-3 bg-black/60 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.4,
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Section - Input Field */}
        <div className="pb-16 pt-4 px-4">
          <motion.div
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.5,
              ease: "easeOut",
            }}
          >
            <motion.div
              className="bg-white/15 backdrop-blur-xl rounded-full border border-white/25 shadow-2xl"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between p-6 sm:p-8">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={handleInputFocus}
                    placeholder={
                      !showChat
                        ? placeholderText + (placeholderText ? "|" : "")
                        : "Type your message..."
                    }
                    className="w-full bg-transparent text-black placeholder-black/60 text-base sm:text-lg outline-none font-mono tracking-wide"
                  />
                </div>

                <motion.button
                  onClick={handleSendMessage}
                  className="ml-4 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-all duration-300 flex-shrink-0"
                  whileHover={{
                    scale: 1.1,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src="/images/send-icon.png"
                    alt="Send"
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
