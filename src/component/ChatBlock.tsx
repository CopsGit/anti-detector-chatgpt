import React from 'react';
import bot from "../assets/bot.svg";
import user from "../assets/user.svg";
import Image from "next/image";
import Detector from "@/component/Detector";

interface ChatBlockProps {
    isAi: boolean;
    value: string;
    uniqueId: string;
}

const ChatBlock: React.FC<ChatBlockProps> = ({isAi, value, uniqueId}) => {

    console.log("ChatBlock: ", isAi, value, uniqueId);

    return (
        <div className={`
            ${isAi ? "bg-white" : "bg-gray-300"} w-full rounded-lg p-3
        `}>
            <div className="
                flex flex-row items-start justify-start
            ">
                <div className={`
                    mr-2 w-12 h-11 rounded-full flex items-center justify-center
                    ${isAi ? "bg-gray-300" : "border-white border-2"}
                    `}>
                    <Image
                        src={isAi ? bot : user}
                        alt={isAi ? 'bot' : 'user'}
                        width={30}
                        height={30}
                    />
                </div>
                <div className="p-3 w-full test-gray-700 whitespace-pre-wrap" id={uniqueId}>
                    {value}
                </div>
            </div>
        </div>
    );
};

export default ChatBlock;