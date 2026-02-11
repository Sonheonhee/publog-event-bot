'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Zap, Search, Code2, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types/stock';
import { geminiEvolutionService } from '@/services/geminiEvolution';
import { storageService } from '@/services/storage';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function DeepResearchTerminal() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'system',
            content: '🚀 Quant Pro Deep Research Terminal v1.0.0\n시스템 준비 완료. 질문을 입력하세요.',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [deepMode, setDeepMode] = useState(false);
    const [isRunningCron, setIsRunningCron] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Create streaming assistant message
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Stream response
            let fullResponse = '';
            for await (const chunk of geminiEvolutionService.streamQuantChat(
                [...messages, userMessage],
                deepMode
            )) {
                fullResponse += chunk;
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantMessage.id
                            ? { ...m, content: fullResponse }
                            : m
                    )
                );
            }

            // Mark streaming complete
            setMessages(prev =>
                prev.map(m =>
                    m.id === assistantMessage.id
                        ? { ...m, isStreaming: false }
                        : m
                )
            );
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '❌ 오류가 발생했습니다. 다시 시도해주세요.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const runEvolutionCron = async () => {
        setIsRunningCron(true);

        // Simulate CRON logs
        const cronLogs: ChatMessage[] = [
            {
                id: `cron-${Date.now()}-1`,
                role: 'system',
                content: '⚡ [CRON] Evolution Routine Started...\n🔗 Connecting to /api/evolution/cron',
                timestamp: new Date(),
            },
        ];

        setMessages(prev => [...prev, ...cronLogs]);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const analyzingLog: ChatMessage = {
            id: `cron-${Date.now()}-2`,
            role: 'system',
            content: '📊 Analyzing current market conditions...\n🧠 Generating new algorithm...',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, analyzingLog]);

        try {
            // Get current version
            const latestPatch = await storageService.getLatestPatch();
            const currentVersion = latestPatch?.version || 'v1.0.0';

            // Get performance data
            const metrics = await storageService.getMetrics();

            // Run evolution
            const newPatch = await geminiEvolutionService.runEvolutionRoutine(
                currentVersion,
                metrics
            );

            // Save patch
            await storageService.saveEvolutionPatch(newPatch);

            // Display results
            const successLog: ChatMessage = {
                id: `cron-${Date.now()}-3`,
                role: 'system',
                content: `✅ Evolution Complete!\n\n**New Version:** ${newPatch.version}\n**Description:** ${newPatch.description}\n\n**Generated Algorithm:**\n\`\`\`python\n${newPatch.pythonCode}\n\`\`\`\n\n**Logic Instruction:**\n${newPatch.logicInstruction}\n\n🎯 System upgraded successfully. Restart to apply changes.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, successLog]);
        } catch (error) {
            console.error('Evolution CRON failed:', error);
            const errorLog: ChatMessage = {
                id: `cron-${Date.now()}-4`,
                role: 'system',
                content: '❌ Evolution routine failed. Check API key and try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorLog]);
        } finally {
            setIsRunningCron(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#09090b] text-gray-100 font-mono">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1f] border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold">Deep Research Terminal</span>
                    <span className="text-xs text-gray-500">v1.0.0</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Deep Mode Toggle */}
                    <button
                        onClick={() => setDeepMode(!deepMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${deepMode
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        Deep Mode {deepMode ? 'ON' : 'OFF'}
                    </button>

                    {/* CRON Button */}
                    <button
                        onClick={runEvolutionCron}
                        disabled={isRunningCron}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isRunningCron ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Zap className="w-3.5 h-3.5" />
                        )}
                        [CRON] Evolution
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        {message.role !== 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Terminal className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : message.role === 'system'
                                        ? 'bg-gray-900 border border-gray-800 text-gray-300'
                                        : 'bg-[#1a1a1f] border border-gray-800 text-gray-100'
                                }`}
                        >
                            {message.role === 'system' ? (
                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                    {message.content}
                                </pre>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus as any}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                        }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                            {message.isStreaming && (
                                <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />
                            )}
                        </div>
                        {message.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                U
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 p-4 bg-[#1a1a1f]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="질문을 입력하세요... (예: 삼성전자 분석해줘)"
                        disabled={isLoading}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
