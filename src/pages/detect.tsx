import React, {useState} from 'react';
import Detector from "@/component/Detector";
import Head from "next/head";

const Detect = () => {
    const [input, setInput] = useState("");
    return (
        <div className={`
            flex flex-col items-center justify-center
            h-screen w-screen bg-gray-100 p-3 overflow-y-auto
        `}>
            <Head>
                <title>ChatGPT Detector</title>
            </Head>
            <textarea
                placeholder="Enter text to detect"
                rows={10}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={`
                    w-full rounded-lg border-2 border-gray-300
                    bg-white h-1/2 focus:outline-none focus:border-blue-500
                    text-base px-4 py-2 resize-none leading-6 transition-colors duration-200 ease-in-out
                `}
            />
            <Detector content={input} page={"detect"}/>
        </div>
    );
};

export default Detect;
