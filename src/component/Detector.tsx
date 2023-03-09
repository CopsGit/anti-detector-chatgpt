import React, {useEffect, useState} from 'react';

interface DetectorProps {
    content: string
    page: "home" | "detect"
}

export const prop = async (content:string) => {
    try{
        const token = process.env.NEXT_PUBLIC_SESS_TOKEN;
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
                'Authorization': `Bearer ${token}`,
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'Origin': 'https://platform.openai.com',
                'Referer': 'https://platform.openai.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
            },
            body: JSON.stringify({
                'prompt': content + "».\n<|disc_score|>",
                'max_tokens': 1,
                'temperature': 1,
                'top_p': 1,
                'n': 1,
                'logprobs': 5,
                'stop': '\n',
                'stream': false,
                'model': 'model-detect-v2',
            }),
        });
        if (response.ok) {
            const json = await response.json();
            const choices = json.choices[0];
            const logprobs = choices.logprobs.top_logprobs[0];
            const probs = Object.fromEntries(
                Object.entries(logprobs).map(([key, value]) => [
                    key,
                    100 * Math.exp(value as number),
                ])
            );

            // Classify the result
            const classMax = [10, 45, 60, 80, 95];
            const possibleClasses = [
                'very unlikely',
                'unlikely',
                'unclear if it is',
                'possibly',
                'likely'
            ];
            const keyProb = probs['"'];
            let classLabel;
            if (classMax[0] < keyProb && keyProb < classMax[classMax.length - 1]) {
                const val = Math.max(...classMax.filter(i => i < keyProb));
                classLabel = possibleClasses[classMax.indexOf(val)];
            } else if (classMax[0] > keyProb) {
                classLabel = possibleClasses[0];
            } else {
                classLabel = possibleClasses[possibleClasses.length - 1];
            }
            const topProb = {'Class': classLabel, 'AI-Generated Probability': keyProb};
            return topProb;
        } else {
            console.log("Error");
        }
    } catch (e) {
        console.log(e);
    }
}

const Detector: React.FC<DetectorProps> = ({content, page}) => {

    const [result, setResult] = useState<any>({});

    const handleClick = async () => {
        const r = await prop(content);
        setResult(r);
    }

    useEffect(() => {
            if (page === "home") {
                handleClick().then(r => r)
            }
        }, [content])

    return (
        <div className={`
            flex flex-col items-center justify-center mt-3
            h-1/2 max-h-36 w-full py-3 px-6 bg-gray-100 rounded-lg shadow-lg
        `}>
            <button onClick={handleClick} className={`${page === "home"? "hidden" : "block"}
                bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
                transition duration-200 ease-in-out transform hover:-translate-y-1 hover:scale-110
            `}>Detect</button>
            <p className={`
                text-xl font-bold mt-3 
                ${result?.Class === 'very unlikely' ? "text-green-500" : result?.Class === 'unlikely' ? "text-green-500" : result?.Class === 'unclear if it is' ? "text-yellow-500" : result?.Class === 'possibly' ? "text-yellow-500" : result?.Class === 'likely' ? "text-red-500" : "text-gray-700"}
            `}>Result: {
                result?.Class ? `${result?.Class} AI-generated` : 'No result yet'
            }</p>
            <div className="flex justify-between w-full mt-5 items-center">
                <span className={`text-lg font-medium ${result?.Class === 'very unlikely' ? "text-green-500" : result?.Class === 'unlikely' ? "text-green-500" : result?.Class === 'unclear if it is' ? "text-yellow-500" : result?.Class === 'possibly' ? "text-yellow-500" : result?.Class === 'likely' ? "text-red-500" : "text-gray-700"}`}>AI-Generated Probability</span>
                <span className={`text-lg font-medium ${result?.Class === 'very unlikely' ? "text-green-500" : result?.Class === 'unlikely' ? "text-green-500" : result?.Class === 'unclear if it is' ? "text-yellow-500" : result?.Class === 'possibly' ? "text-yellow-500" : result?.Class === 'likely' ? "text-red-500" : "text-gray-700"}`}>{result ? result['AI-Generated Probability']?.toFixed(2) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700">
                <div
                    className={`h-5 rounded-full ${result?.Class === 'very unlikely' ? "bg-green-500" : result?.Class === 'unlikely' ? "bg-green-500" : result?.Class === 'unclear if it is' ? "bg-yellow-500" : result?.Class === 'possibly' ? "bg-yellow-500" : result?.Class === 'likely' ? "bg-red-500" : "bg-gray-700"}`}
                    style={{width: `${result && result['AI-Generated Probability']?.toFixed(2)}%`}}></div>
            </div>
        </div>
    );
};

export default Detector;
