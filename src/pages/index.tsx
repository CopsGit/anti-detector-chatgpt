import Head from 'next/head';
import Image from 'next/image';
import {Inter} from 'next/font/google';
import React, {useEffect, useRef, useState} from 'react';
import sendIcon from '../assets/send.svg';
import ChatBlock from '@/component/ChatBlock';
import Link from "next/link";
import {marked} from "marked";
import Detector, {prop} from "@/component/Detector";
import ReactDOM from 'react-dom';

const inter = Inter({subsets: ['latin']});

interface Alert {
    id?: number,
    type?: 'error' | 'success' | '',
    message?: string,
}

export default function Home() {
    const [chatData, setChatData] = useState<{
        isAi: boolean;
        value: any;
        uniqueId: string;
    }[]>([]);
    const [apiKey, setApiKey] = useState<string>("");
    const [apiKeyInput, setApiKeyInput] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>('');
    const [wordLimit, setWordLimit] = useState<number>(100);
    const [uniqueId, setUniqueId] = useState<string>('');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [generatedChat, setGeneratedChat] = useState<String>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [detect, setDetect] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const apiKeyFromLocalStorage = typeof window !== 'undefined' && localStorage.getItem('apiKey');
        setApiKeyInput(apiKeyFromLocalStorage || "");
        setApiKey(apiKeyFromLocalStorage || "");
    }, []);

    const handleSaveApiKey = async () => {
        setLoading(true);
        if (apiKeyInput === "") {
            setAlerts([{
                id: Date.now(),
                type: 'error',
                message: "API key can't be empty",
            }])
        }

        try {
            const response = await fetch(`/api/validate?apiKey=${apiKeyInput}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                localStorage.setItem('apiKey', apiKeyInput);
                setApiKey(apiKeyInput);
                setAlerts([{
                    id: Date.now(),
                    type: 'success',
                    message: 'API key saved successfully',
                }])
            }

            setLoading(false);
        } catch (e) {
            setAlerts([{
                id: Date.now(),
                type: 'error',
                message: 'Your API key is invalid. Please enter a valid API key.',
            }])

            setLoading(false);
        }
    }

    const handleClearApiKey = async () => {
        setApiKey("");
        setApiKeyInput("");
        localStorage.removeItem('apiKey');
        setAlerts([{
            id: Date.now(),
            type: 'success',
            message: 'API key cleared successfully',
        }])
    }

    const handleDismiss = (id: any) => {
        setAlerts(alerts.filter(alert => alert.id !== id));
    }

    let loadInterval: NodeJS.Timeout;

    // const handleTypeResponse = (element: HTMLElement, text: string) => {
    //     element.innerHTML = text;
    //
    //     // const detect = prop(text)
    //     // // Create a new Detector element and append it to the messageDiv
    //     // const detectorElement = document.createElement('div');
    //     // ReactDOM.render(<Detector content={text} page="home" />, detectorElement);
    //     // element.appendChild(detectorElement);
    // };

    const handleUid = () => {
        const timestamp = Date.now();
        const randomNumber = Math.random();
        const hexadecimalString = randomNumber.toString(16);

        return `id-${timestamp}-${hexadecimalString}`;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setGeneratedChat('')
        setDetect(false)

        if (apiKey === "") {
            setAlerts([{
                id: Date.now(),
                type: 'error',
                message: 'API key is missing. Please enter a valid API key.',
            }]);


            return;
        }

        if (inputValue === '') {
            setAlerts([{
                id: Date.now(),
                type: 'error',
                message: 'Please enter a message',
            }]);

            return;
        }

        const newChatMan = {
            isAi: false,
            value: inputValue,
            uniqueId: handleUid(),
        };

        // bot's chatstripe
        const uniqueId = handleUid();
        setUniqueId(uniqueId);

        const newChatBot = {
            isAi: true,
            value: '...',
            uniqueId,
        };

        setChatData([newChatMan, newChatBot]);
    };

    useEffect(() => {
        const fetchChat = async () => {

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: inputValue,
                    apiKey,
                    wordLimit,
                }),
            });

            clearInterval(loadInterval);

            setInputValue('');

            if (response.status === 200) {
                // This data is a ReadableStream
                const data = response.body;
                if (!data) {
                    return;
                }

                const reader = data.getReader();
                const decoder = new TextDecoder();
                let done = false;

                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    const chunkValue = decoder.decode(value).replace("<|im_end|>", "");
                    setGeneratedChat((prev) => prev + chunkValue);
                }

                setDetect(true)

            } else {
                const err = await response.json();
                setAlerts([{
                    id: Date.now(),
                    type: 'error',
                    message: err.message,
                }])
            }
        };

        if (uniqueId) {
            fetchChat().then();
        }
    }, [chatData, uniqueId]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTo({
                top: chatRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [chatData, generatedChat, detect]);

    return (
        <>
            <Head>
                <title>ChatGPT API</title>
                <meta name="description" content="Generated by create next app"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className="
        flex flex-col items-center justify-between
        w-full h-screen bg-gradient-to-r from-blue-400 to-blue-600
        ">

                <div
                    className={`
                flex flex-col items-center justify-start
                w-11/12 h-full overflow-y-auto py-4 gap-4
                `}
                    id="chat_container"
                    ref={chatRef}
                >
                    {
                        chatData.length === 0 &&
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            flexDirection: 'column',
                            color: '#fff',
                            gap: '1rem'
                        }}>
                            <h1 className={`
                            text-2xl font-bold text-center text-white
                            md:text-3xl lg:text-4xl xl:text-5xl md:leading-tight
                        `}>Hi, I&apos;m a ChatGPT Clone built with ChatGPT API</h1>
                            <p className={`
                            text-lg text-center text-white md:text-xl
                        `}>Please set your own OpenAi API Key below to start chatting with me</p>
                            <p className={`
                            text-sm text-center text-white
                        `}>(Your API Key will be stored in your browser&apos;s local storage, not on our server)</p>
                            <div className={`
                            flex flex-col md:flex-row items-center justify-center gap-3
                        `}>
                                <input
                                    className={`
                                w-full px-4 py-2 text-lg text-gray-900 bg-white rounded-lg
                                focus:outline-none mr-3 mb-3 md:mb-0 md:mr-0 shadow-lg 
                                transition duration-300 ease-in-out hover:shadow-xl focus:shadow-xl hover:scale-105
                                    `} type="text" name="api_key" id="api_key"
                                    placeholder="OpenAi API Key"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                />
                                <button
                                    onClick={apiKey === '' ? handleSaveApiKey : handleClearApiKey}
                                    className={`
                                    w-20 px-4 py-2 text-lg text-blue-500 bg-white rounded-lg flex items-center justify-center
                                    focus:outline-none shadow-lg font-bold hover:bg-blue-100
                                    transition duration-300 ease-in-out hover:shadow-xl focus:shadow-xl
                                `}
                                >{
                                    apiKey === '' ?
                                        loading ?
                                            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            : 'Save'
                                        : 'Clear'
                                }
                                </button>
                            </div>

                            <p className={`
                            text-lg text-center text-white md:text-xl
                        `}>
                                OpenAi Model: <Link href="https://platform.openai.com/docs/models/gpt-3-5"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`
                                                text-white hover:text-blue-300 transition duration-300 ease-in-out
                                                `}
                            >gpt-3.5-turbo</Link>
                            </p>
                            <p className={`
                            text-lg text-center text-white md:text-xl
                        `}>
                                Github Repo: <Link href="https://github.com/CopsGit/anti-detector-chatgpt"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`
                                                text-white hover:text-blue-300 transition duration-300 ease-in-out
                                                `}
                            >anti-detector-chatgpt</Link>
                            </p>
                        </div>
                    }
                    {chatData[0]?.value.length > 0 && <ChatBlock isAi={false} value={chatData[0]?.value} uniqueId={chatData[0]?.uniqueId}/>}
                    {
                        generatedChat.length > 0 &&
                        <div
                            className={`
                        flex flex-col items-center justify-start
                        w-full h-full py-4 gap-4
                    `}
                        >
                            <ChatBlock isAi={true} value={generatedChat as string} uniqueId={chatData[1]?.uniqueId}/>
                            {detect && <Detector content={generatedChat as string} page={"home"}/>}
                        </div>
                    }
                </div>
                <form
                    onSubmit={handleSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSubmit(e).then()
                        }
                    }}
                    className={`
                    flex items-center justify-between w-11/12 h-20 px-4 py-2
                    bg-white rounded-lg shadow-lg mb-3
                `}
                >
                <textarea
                    className={`
                        w-full px-4 py-2 text-lg text-gray-900 bg-white rounded-lg
                        focus:outline-none mr-3
                        transition-all duration-300 ease-in-out 
                    `}
                    name="prompt"
                    rows={1}
                    cols={1}
                    placeholder="Ask ChatGPT..."
                    required
                    onChange={(e) => setInputValue(e.target.value)}
                    value={inputValue}
                ></textarea>
                    <select
                        name="wordLimit"
                        id="wordLimit"
                        className={`w-40 px-4 py-2 text-lg text-gray-900 bg-white rounded-xl
                        focus:outline-none mr-3 shadow-lg border-2 border-blue-400
                        transition-all duration-300 ease-in-out
                        `}
                        onChange={(e) => setWordLimit(parseInt(e.target.value))}
                        value={wordLimit}
                    >
                        <option value="100">100 Words</option>
                        <option value="250">250 Words</option>
                        <option value="500">500 Words</option>
                        <option value="750">750 Words</option>
                        <option value="1000">1000 Words</option>
                    </select>
                    <button
                        className={`
                    w-12 h-12 bg-blue-400 rounded-xl shadow-lg
                    flex items-center justify-center
                    transition-all duration-300 ease-in-out
                    hover:bg-blue-500 focus:outline-none
                  `}
                        type="submit"><Image src={sendIcon} alt="send" width={20} height={20}/></button>
                </form>
                {
                    alerts.length > 0 && <div className="absolute z-50 right-3 top-3 flex flex-col items-start justify-start max-h-screen">
                        {alerts?.map((alert, index) => (
                            <div key={index} className={`${
                                alert ? "flex my-2 w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800" : "hidden"
                            }`}>
                                <div className={`flex items-center justify-center w-12 ${alert?.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
                                    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 40 40"
                                         xmlns="http://www.w3.org/2000/svg">
                                        {
                                            alert?.type === "success" ? (<path
                                                    d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM16.6667 28.3333L8.33337 20L10.6834 17.65L16.6667 23.6166L29.3167 10.9666L31.6667 13.3333L16.6667 28.3333Z"/>
                                            ) : (
                                                <path d="M20 3.36667C10.8167 3.36667 3.3667 10.8167 3.3667 20C3.3667 29.1833 10.8167 36.6333 20 36.6333C29.1834 36.6333 36.6334 29.1833 36.6334 20C36.6334 10.8167 29.1834 3.36667 20 3.36667ZM19.1334 33.3333V22.9H13.3334L21.6667 6.66667V17.1H27.25L19.1334 33.3333Z" />
                                            )
                                        }
                                    </svg>
                                </div>

                                <div className={`
                    flex justify-between items-center w-full
                `}>
                                    <div className="px-4 py-2 -mx-3">
                                        <div className="mx-3">
                                            <span className={`font-semibold capitalize ${alert?.type === "success" ? "text-emerald-500 dark:text-emerald-400": "text-red-500 dark:text-red-400"}`}>{alert?.type}</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-200">{alert?.message}</p>
                                        </div>
                                    </div>

                                    <button onClick={()=> {handleDismiss(alert.id)}} className="mx-2 px-3 focus:outline-none">
                                        <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="none" stroke="#000" strokeWidth="2" d="M3,3 L21,21 M3,21 L21,3"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </main>
        </>
    )
}
